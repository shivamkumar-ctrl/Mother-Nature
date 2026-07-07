import { db, productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

// ─── helpers ────────────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function price(category: string, careLevel: string, name: string): string {
  const base: Record<string, [number, number]> = {
    "bloom-throughout-year": [8,  25],
    "summer-flowers":        [6,  20],
    "winter-flowers":        [5,  15],
    "monsoon-flowers":       [9,  28],
    "indoor-plants":         [14, 55],
    "air-purifiers":         [19, 75],
    "medical-herbs":         [4,  14],
    "outdoor-plants":        [9,  34],
  };
  const [lo, hi] = base[category] ?? [8, 25];
  const multiplier = careLevel === "Easy" ? 1 : careLevel === "Moderate" ? 1.5 : 2.2;
  const spread = (hash(name) % 100) / 100;
  const raw = lo * multiplier + (hi - lo) * spread;
  return (Math.round(raw * 100) / 100).toFixed(2);
}

function stockCount(name: string): number {
  return 15 + (hash(name + "stock") % 36);
}

/** Pick 2-3 images from a category pool deterministically */
function pickImages(name: string, pool: string[]): string[] {
  const n = pool.length;
  const count = 2 + (hash(name) % 2); // 2 or 3 images
  const start = hash(name + "img") % n;
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[(start + i) % n]);
  }
  return picked;
}

// ─── image pools per category ────────────────────────────────────────────────

const IMAGE_POOLS: Record<string, string[]> = {
  "bloom-throughout-year": [
    "https://gardenerspath.com/wp-content/uploads/2020/03/Red-Hibiscus-Flowers-in-Bright-Sunshine.jpg",
    "https://gardenerspath.com/wp-content/uploads/2022/09/Orange-Bougainvillea-Cascading-over-a-Fence.jpg",
    "https://www.rainbowgardens.biz/wp-content/uploads/2026/04/stock-flowers-1-1-500x419.jpg",
    "https://www.rainbowgardens.biz/wp-content/uploads/2026/04/stock-flowers-13-500x419.jpg",
    "https://hips.hearstapps.com/hmg-prod/images/summer-flowers-lantana-65bd6a81437e0.jpg?crop=0.575xw:0.864xh;0.150xw,0.0401xh",
    "https://www.gardenia.net/wp-content/uploads/2024/12/shutterstock_2505732167.jpg",
  ],
  "summer-flowers": [
    "https://hips.hearstapps.com/hmg-prod/images/643ed36c-f6a2-47bd-bb56-6fd2cb8be56e.jpeg?crop=0.667xw:1xh;0.196xw,0xh&resize=360:*",
    "https://hips.hearstapps.com/hmg-prod/images/9e8a06fb-5fdc-4e03-b243-f55cdf06a228.jpeg?crop=0.600xw:0.901xh;0.328xw,0.0969xh&resize=640:*",
    "https://www.gardenia.net/wp-content/uploads/2023/05/flowers-and-herbs-for-rock-garden-300x300.webp",
    "https://www.gardenia.net/wp-content/uploads/2024/12/shutterstock_2505732167.jpg",
    "https://hips.hearstapps.com/hmg-prod/images/summer-flowers-lantana-65bd6a81437e0.jpg?crop=0.575xw:0.864xh;0.150xw,0.0401xh",
    "https://gardenerspath.com/wp-content/uploads/2020/03/Red-Hibiscus-Flowers-in-Bright-Sunshine.jpg",
  ],
  "winter-flowers": [
    "https://agriplanting.com/wp-content/uploads/2022/12/Petunia-winter-flowers.jpg",
    "https://agriplanting.com/wp-content/uploads/2022/12/winter-flowers-plants-Pansy.jpg",
    "https://blog.sfapp.magefan.top/media/urban-plant-india.myshopify.com/images/Winter%20Plants/3.webp",
    "https://blog.sfapp.magefan.top/media/urban-plant-india.myshopify.com/images/Winter%20Plants/5.webp",
    "https://www.gardenia.net/wp-content/uploads/2023/05/flowers-and-herbs-for-rock-garden-300x300.webp",
    "https://hips.hearstapps.com/hmg-prod/images/643ed36c-f6a2-47bd-bb56-6fd2cb8be56e.jpeg?crop=0.667xw:1xh;0.196xw,0xh&resize=360:*",
  ],
  "monsoon-flowers": [
    "https://www.andedge.com/wp-content/uploads/2024/12/Sacred_lotus_Nelumbo_nucifera.jpg",
    "https://media.gettyimages.com/id/688852624/photo/wet-hibiscus-flower-in-the-garden.jpg?s=612x612&w=0&k=20&c=vLvyhu4Wlg8LXFKSb0iF_1e_rvXTeRZMEBIgyG52WQc=",
    "https://media.gettyimages.com/id/628005070/photo/isolated-wet-hibiscus-flower-on-the-green-background.jpg?s=612x612&w=0&k=20&c=8XH9Y_a0a-GoMp6NCMrdEsy5O4wMiQb5ljRGL2dSRdU=",
    "https://www.idyl.co.in/cdn/shop/articles/out-0_8a34cae2-a7c2-4781-ac4b-c8d886156736_1100x.png?v=1744568747",
    "https://gardenerspath.com/wp-content/uploads/2020/03/Red-Hibiscus-Flowers-in-Bright-Sunshine.jpg",
    "https://www.rainbowgardens.biz/wp-content/uploads/2026/04/stock-flowers-1-1-500x419.jpg",
  ],
  "indoor-plants": [
    "https://hips.hearstapps.com/hmg-prod/images/peace-lily-plant-in-a-bright-home-royalty-free-image-1574380038.jpg?crop=0.536xw:1.00xh;0.167xw,0",
    "https://hips.hearstapps.com/hmg-prod/images/bright-living-room-with-houseplant-on-a-cupboard-in-royalty-free-image-1574379918.jpg?crop=0.536xw:1.00xh;0.0765xw,0",
    "https://images-na.ssl-images-amazon.com/images/I/61akL8tzhiL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/61axynVqYxL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/51Z-QO31m5L.jpg",
    "https://floweraura-blog-img.s3.ap-south-1.amazonaws.com/plants-blog/Peace-Lily-M.jpg",
  ],
  "air-purifiers": [
    "https://www.farmersalmanac.com/wp-content/uploads/2026/06/air-purifying-houseplants-living-room-collection.jpg",
    "https://floweraura-blog-img.s3.ap-south-1.amazonaws.com/plants-blog/Peace-Lily-M.jpg",
    "https://allaboutplanties.com/cdn/shop/files/peace-lily-hero-image-all-about-planties.png?v=1775711884&width=600",
    "https://floweraura-blog-img.s3.ap-south-1.amazonaws.com/plants-blog/Peace-Lily-D.jpg",
    "https://hips.hearstapps.com/hmg-prod/images/peace-lily-plant-in-a-bright-home-royalty-free-image-1574380038.jpg?crop=0.536xw:1.00xh;0.167xw,0",
    "https://hips.hearstapps.com/hmg-prod/images/bright-living-room-with-houseplant-on-a-cupboard-in-royalty-free-image-1574379918.jpg?crop=0.536xw:1.00xh;0.0765xw,0",
  ],
  "medical-herbs": [
    "https://blog.sfapp.magefan.top/media/urban-plant-india.myshopify.com/images/Medicinal%20Plants/1%20(1).webp",
    "https://www.asiafarming.com/wp-content/uploads/2022/10/Medicinal-Plants_Herbs-Contract-Farming-in-India1-1024x683.jpg",
    "https://www.asiafarming.com/wp-content/uploads/2022/10/Medicinal-Plants_Herbs-Contract-Farming-in-India5-1024x576.jpg",
    "https://www.urbanplant.in/a/blog/media/urban-plant-india.myshopify.com/Post/featured_img/Add_a_subheading_(2)_(2).webp",
    "https://www.asiafarming.com/wp-content/uploads/2022/10/Medicinal-Plants_Herbs-Contract-Farming-in-India4-1024x543.jpg",
    "https://www.gardenia.net/wp-content/uploads/2023/05/flowers-and-herbs-for-rock-garden-300x300.webp",
  ],
  "outdoor-plants": [
    "https://lirp.cdn-website.com/db534b0a/dms3rep/multi/opt/rosehill-palms-bougainvillea-barbara-karst-1920w.webp",
    "https://lirp.cdn-website.com/db534b0a/dms3rep/multi/opt/rosehill-palms-bougainvillea-vera-deep-purple-1920w.webp",
    "https://lirp.cdn-website.com/db534b0a/dms3rep/multi/opt/rosehill-palms-bougainvillea-white-madonna-1920w.webp",
    "https://thumbs.dreamstime.com/b/egyptian-plants-flowers-flowering-bougainvillea-branch-background-palm-trees-68548895.jpg",
    "https://gardenerspath.com/wp-content/uploads/2022/09/Orange-Bougainvillea-Cascading-over-a-Fence.jpg",
    "https://www.gardendesign.com/pictures/images/320x320Exact_0x66/dream-team-s-portland-garden_6/hollywood-hibiscus-america-s-sweetheart-tropical-hibiscus-proven-winners_18799.jpg",
  ],
};

// ─── product data ────────────────────────────────────────────────────────────

type Row = {
  name: string; description: string;
  watering: string; light: string; careLevel: string; category: string;
};

const PRODUCTS: Row[] = [
  // ── Bloom Throughout Year ─────────────────────────────────────────────────
  { category:"bloom-throughout-year", name:"Vinca", description:"A hardy, drought-tolerant perennial featuring glossy leaves and continuous star-shaped blossoms.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Portulaca", description:"A low-growing, sun-loving succulent groundcover that opens vibrant, satiny flowers on sunny mornings.", watering:"Once a week", light:"Bright Direct Light", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Bougainvillea", description:"A vigorous thorny climber displaying papery, colorful bracts that thrive in intense tropical heat.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Ixora", description:"A dense evergreen shrub bearing compact, large clusters of bright tubular flowers year-round.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Hibiscus", description:"A moisture-loving tropical shrub that peaks in flower size and vibrance during warm months.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Pentas", description:"A butterfly-magnet bedding plant producing domed clusters of star-shaped blooms non-stop.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Lantana", description:"A tough, fragrant shrub whose multicolored flower heads shift hues as they age.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Periwinkle", description:"A cheerful groundcover producing flat, five-petaled flowers in pink, white, or mauve throughout the year.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Crossandra", description:"A popular Indian garden plant with salmon-orange blooms that thrive in humid, shaded spots.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Adenium", description:"A striking succulent shrub with a swollen caudex and brilliant trumpet-shaped flowers.", watering:"Once in 10 days", light:"Full Sun", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Geranium", description:"A classic balcony plant bearing rounded heads of vibrant flowers above scented, zonal-marked leaves.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Kalanchoe", description:"A cheerful succulent that rewards minimal care with long-lasting clusters of bright blooms.", watering:"Once in 2 weeks", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Jasmine", description:"A beloved fragrant vine that perfumes the air with small white star-shaped flowers.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Rangoon Creeper", description:"A fast-climbing vine producing fragrant flowers that transform from white to pink to deep red.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Tecoma", description:"A vigorous tropical shrub covered in bright yellow or orange trumpet-shaped blooms.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Allamanda", description:"A showy tropical vine or shrub featuring large, glossy, golden-yellow funnel flowers.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Plumbago", description:"A sprawling shrub with delicate phlox-like clusters of sky-blue or white flowers.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Crown of Thorns", description:"A succulent shrub with waxy leaves and tiny, bright flower clusters that bloom year-round.", watering:"Once in 10 days", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Mexican Heather", description:"A fine-textured, mounding plant covered with tiny lavender-purple flowers throughout warm weather.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Impatiens", description:"A shade-tolerant annual producing a continuous flush of flat-faced flowers in vivid colours.", watering:"Three times a week", light:"Partial Shade", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Torenia", description:"A charming annual with bicoloured blooms that thrives in heat and humidity.", watering:"Twice a week", light:"Partial Shade", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Angelonia", description:"An upright annual with orchid-like spikes of fragrant flowers that tolerate heat superbly.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Begonia", description:"A versatile flowering plant for shade, producing waxy flowers in shades of red, pink, and white.", watering:"Twice a week", light:"Partial Shade", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Vervain", description:"A free-flowering perennial herb covered in tiny, vivid purple or red blossoms.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Salvia (Tropical)", description:"A tropical variety with brilliant red or blue flower spikes attractive to hummingbirds and butterflies.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Gaillardia", description:"A bold, daisy-like perennial with fiery red-orange petals tipped in yellow, highly drought tolerant.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Gazania", description:"A sun-closing daisy that opens bold striped flowers on sunny days, thriving in dry hot spots.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Celosia", description:"A striking annual with velvety, fan-shaped or feathery plumes in electric shades of red, gold, and pink.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Blue Daze", description:"A creeping tropical groundcover with small but vivid sky-blue flowers and silver-tinged leaves.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Ruellia", description:"A tough perennial producing purple, pink, or white petunia-like blooms in sun or part shade.", watering:"Once a week", light:"Full Sun to Partial Shade", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Golden Dewdrop", description:"An arching shrub with lavender flower clusters followed by decorative golden-yellow berry strings.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Barleria", description:"A robust shrub producing masses of tubular purple or yellow flowers, often used as a hedge.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Crape Jasmine", description:"A neat evergreen shrub with intensely fragrant, pinwheel-shaped white flowers.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Hamelia", description:"A tropical shrub bearing tubular orange-red flowers in cymes that attract butterflies and hummingbirds.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Russelia", description:"A graceful arching shrub with cascading stems covered in tubular scarlet flowers like living fireworks.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Duranta", description:"A fast-growing ornamental shrub with chains of delicate purple flowers and ornamental yellow berries.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Butterfly Pea", description:"A twining vine with intense, vivid blue butterfly-shaped flowers used in natural food colouring.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Clerodendrum", description:"A showy shrub producing clusters of star-shaped white flowers with long, red stamens.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Mexican Petunia", description:"An ultra-tough perennial that spreads gracefully, producing purple trumpet flowers daily.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Mandevilla", description:"A twining tropical vine boasting large, satiny funnel flowers in bold pink or red.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Canna Lily", description:"A bold tropical perennial with paddle-like leaves and large, iris-like flowers in fiery colours.", watering:"Three times a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Rain Lily", description:"A bulbous perennial that pops up and blooms magically after monsoon rains.", watering:"As needed (rain-dependent)", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Wedelia", description:"A vigorous groundcover producing sunny yellow daisy flowers that rapidly cover slopes and banks.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Madagascar Periwinkle", description:"A heat-loving annual producing bright, waxy five-petaled flowers in pink, white, or bicolours.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Snapdragon Vine", description:"A delicate climbing vine with snapdragon-like flowers that dangle ornamentally.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"bloom-throughout-year", name:"Yellow Bells", description:"A fast-growing shrub producing masses of bright yellow bell-shaped flowers.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"bloom-throughout-year", name:"Petunia (Bloom Year)", description:"A prolific trailing annual ideal for hanging baskets, continuously blooming in warm climates.", watering:"Three times a week", light:"Full Sun", careLevel:"Moderate" },

  // ── Summer Flowers ────────────────────────────────────────────────────────
  { category:"summer-flowers", name:"Blanket Flower", description:"A tough, heat-loving perennial producing vivid red-and-yellow daisy blooms that last all summer.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Bougainvillea (Summer)", description:"A sun-loving climber that explodes into spectacular colour during peak summer heat.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Beardtongue", description:"An upright perennial with tubular two-lipped flowers in jewel tones loved by hummingbirds.", watering:"Once a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"summer-flowers", name:"Chrysanthemums", description:"A beloved florist's flower producing dense, rounded blooms in a wide spectrum of colours.", watering:"Three times a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"summer-flowers", name:"Daffodils", description:"A cheerful spring bulb with trumpet-shaped yellow flowers and a light honey fragrance.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Dahlia", description:"A showy tuber plant producing dinner-plate blooms in almost every colour except true blue.", watering:"Three times a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"summer-flowers", name:"Daylily", description:"A vigorous clumping perennial with lily-like blooms that each last just one perfect day.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Gloriosa Daisy", description:"A cheerful rudbeckia variety with large golden-yellow flowers centered in rich mahogany brown.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Globe Amaranth", description:"A long-lasting annual with clover-like, papery globe flowers that dry perfectly for arrangements.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Lavender", description:"An aromatic sub-shrub with wand-like purple flower spikes beloved for fragrance and pollinator value.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Lilies", description:"A stately bulbous plant producing large, trumpet or bowl-shaped flowers with powerful fragrance.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"summer-flowers", name:"Marigold", description:"An indispensable Indian garden flower with bright pom-pom blooms that also repel pests.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"summer-flowers", name:"Musk Rose", description:"A wild-type climbing rose producing large trusses of single, musk-scented white flowers.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },

  // ── Winter Flowers ────────────────────────────────────────────────────────
  { category:"winter-flowers", name:"Alyssum", description:"A low-growing carpet annual with masses of honey-scented tiny white or pink flowers.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Antirrhinum", description:"A cool-season classic producing tall spikes of dragon-mouthed flowers in every warm tone.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Aster", description:"A cheerful daisy-like flower producing a profusion of yellow-centred blooms in autumn shades.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Calendula", description:"A hardy cool-season annual with edible, medicinal marigold-like flowers in gold and orange.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Clarkia", description:"A native annual producing elegant, frilled, double flower ruffles along long upright stems.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Dianthus", description:"A compact carnation relative sporting fringed, multi-colored petals with a light, spicy clove aroma.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Hollyhock", description:"A towering cottage-garden classic producing huge saucer-shaped flowers up tall, vertical stems.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"winter-flowers", name:"Larkspur", description:"A stately cool-season annual carrying complex, spurred blue or pink flower towers on lacy foliage.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"winter-flowers", name:"Pansy", description:"A flat-faced cool-season flower carrying distinct, overlapping petals that resemble expressive human faces.", watering:"Three times a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"winter-flowers", name:"Petunia (Winter)", description:"A prolific trailing annual ideal for hanging baskets, windowsills, and color-blocked landscape rows.", watering:"Three times a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"winter-flowers", name:"Phlox", description:"A dense, star-patterned cluster flower that transforms garden borders into a solid blanket of color.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Salvia (Winter)", description:"A favorite source of nectar for pollinators, producing vivid colored spikes that resist light frosts.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Sweet Pea", description:"A climbing cool-weather annual displaying delicate, wing-shaped flowers with an intensely sweet perfume.", watering:"Three times a week", light:"Full Sun", careLevel:"Hard" },
  { category:"winter-flowers", name:"Verbena", description:"A spreading bedding plant displaying flat heads of rich, pinwheel-patterned flowers over dark green foliage.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"winter-flowers", name:"Statice", description:"A specialized cut-flower selection whose papery, intense purple calyxes retain their color permanently when dried.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },

  // ── Monsoon Flowers ───────────────────────────────────────────────────────
  { category:"monsoon-flowers", name:"Lotus", description:"An aquatic plant of profound cultural significance, raising majestic, pristine blossoms above muddy water.", watering:"Keep Flooded", light:"Full Sun", careLevel:"Hard" },
  { category:"monsoon-flowers", name:"Gulmohar", description:"A magnificent wide-canopied tree that bursts into brilliant, fiery orange-red flower spreads during summer.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"monsoon-flowers", name:"Indigo", description:"A legendary legume shrub traditionally processed to extract rich, natural deep-blue textile dye.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"monsoon-flowers", name:"Monsoon Cassia", description:"A spectacular deciduous tree celebrated for its dramatic cascading showers of bright yellow blossoms.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"monsoon-flowers", name:"Cape Jasmine", description:"A high-humidity loving shrub with thick waxy leaves and heavily perfumed, double white flowers.", watering:"Three times a week", light:"Partial Shade", careLevel:"Hard" },
  { category:"monsoon-flowers", name:"Hibiscus (Monsoon)", description:"A moisture-loving tropical staple that peaks in flower size during humid monsoon periods.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"monsoon-flowers", name:"Dew Flower", description:"A delicate, low-lying ground herb producing tiny, glistening blue or purple flowers each morning.", watering:"Twice a week", light:"Partial Shade", careLevel:"Easy" },

  // ── Indoor Plants ─────────────────────────────────────────────────────────
  { category:"indoor-plants", name:"Peace Lily", description:"A dependable air-clearing indoor plant with glossy broad leaves and elegant white flower spathes.", watering:"Once a week", light:"Low to Medium Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Monstera Deliciosa", description:"A trendy tropical climber admired for its massive heart-shaped leaves that develop natural interior splits.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Jade Mini Plant", description:"A compact succulent tree with thick, fleshy rounded leaves considered a symbol of good luck.", watering:"Once in 2 weeks", light:"Bright Direct Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Areca Palm", description:"A feathery, multi-stemmed indoor palm that softens spaces with upright, arching chartreuse fronds.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"indoor-plants", name:"Anthurium Red Plant", description:"An exotic indoor accent displaying glossy, heart-shaped red leather spathes with prominent yellow spadixes.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"indoor-plants", name:"Bird of Paradise Plant", description:"A majestic architectural plant carrying large paddle leaves and crane-like, orange-blue tropical blossoms.", watering:"Once a week", light:"Bright Direct Light", careLevel:"Moderate" },
  { category:"indoor-plants", name:"China Doll Plant", description:"A delicate-looking houseplant covered in lacy, highly glossy, finely divided emerald-green leaflets.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Hard" },
  { category:"indoor-plants", name:"Money Plant Golden", description:"A ubiquitous, trailing vining houseplant featuring heart-shaped leaves splashed with bright golden-yellow variegation.", watering:"Once a week", light:"Low to Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Lucky Bamboo Plant", description:"A water-grown Dracaena variant easily trained into spirals, widely used in Feng Shui arrangements.", watering:"Change water weekly", light:"Medium Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Money Plant Variegated", description:"A hardy trailing vine displaying mixed marbling textures of white, cream, and green across its leaves.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Aglaonema Pink Beauty", description:"A stunning, low-light houseplant featuring broad green leaves heavily marbled with bright pink tones.", watering:"Once in 10 days", light:"Low to Medium Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Bamboo Palm Plant", description:"A clustering, shade-loving palm featuring slender, reed-like canes that act as an excellent room screen.", watering:"Twice a week", light:"Medium Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"ZZ Plant", description:"An ultra-hardy plant with upright, succulent stems covered in polished, mirror-shiny green leaf scales.", watering:"Once a month", light:"Low to Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Snake Plant Golden Hahnii", description:"A compact, rosette-forming succulent variety featuring wide snake-patterned leaves edged in cream-yellow strips.", watering:"Once in 3 weeks", light:"Low to Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Ficus Bonsai Plant", description:"A miniature woody tree displaying dense, aerial-rooting trunks and tight, glossy canopy leaves.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Hard" },
  { category:"indoor-plants", name:"Rubber Plant", description:"A robust indoor tree with oversized, thick, leathery leaves featuring a dark burgundy sheen.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Peacock Plant", description:"A highly decorative Calathea variant featuring intricate, feather-like dark green patterning over red leaf undersides.", watering:"Twice a week", light:"Medium Indirect Light", careLevel:"Hard" },
  { category:"indoor-plants", name:"Lotus Bamboo Plant", description:"A thick-stemmed, upright plant variant whose dense, overlapping leaves resemble small lotus rosettes.", watering:"Once a week", light:"Medium Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Thuja Plant", description:"An aromatic, scale-leafed evergreen conifer traditionally grown in pairs near main residential entranceways.", watering:"Once a week", light:"Full Sun to Partial Shade", careLevel:"Easy" },
  { category:"indoor-plants", name:"Calathea Sanderiana", description:"A premium foliage plant displaying fine, pink pinstripes hand-painted across dark purple-backed leaves.", watering:"Twice a week", light:"Medium Indirect Light", careLevel:"Hard" },
  { category:"indoor-plants", name:"Peperomia Green Plant", description:"A compact indoor accent featuring thick, fleshy, moisture-storing green leaves on reddish stems.", watering:"Once in 10 days", light:"Medium to Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Ficus Moclame Plant", description:"An elegant interior fig tree shaped with dense, glossy, rounded leaves on upright wood stems.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"indoor-plants", name:"Fittonia Green Plant", description:"A low-growing tropical plant carrying striking, highly detailed white or pink vein webs over its leaves.", watering:"Three times a week", light:"Medium Indirect Light", careLevel:"Moderate" },
  { category:"indoor-plants", name:"Philodendron Birkin Plant", description:"A slow-growing container plant showcasing sharp, clean, bright white pinstripes on dark green leaves.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"indoor-plants", name:"Croton Petra", description:"A bold shrub containing stiff leaves brightly painted in autumn shades of yellow, red, and orange.", watering:"Twice a week", light:"Bright Direct Light", careLevel:"Moderate" },

  // ── Air Purifiers ─────────────────────────────────────────────────────────
  { category:"air-purifiers", name:"Orchid", description:"An exotic epiphytic plant valued for its long-lasting, architecturally complex, symmetrical blossoms.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Hard" },
  { category:"air-purifiers", name:"Anthurium (Air)", description:"A reliable indoor bloomer that actively removes ammonia, formaldehyde, and xylene from indoor environments.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"air-purifiers", name:"Bird of Paradise (Air)", description:"A majestic specimen plant that processes large quantities of indoor air pollutants through its broad leaves.", watering:"Once a week", light:"Bright Direct Light", careLevel:"Moderate" },
  { category:"air-purifiers", name:"Snake Plant Zeylanica", description:"A virtually indestructible air purifier that converts CO₂ to oxygen even at night.", watering:"Once in 3 weeks", light:"Low to Bright Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Philodendron Brasil", description:"A fast-growing trailing plant with neon-yellow variegated leaves that filters formaldehyde.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Jasmine Sambac", description:"India's national flower, whose intensely sweet fragrance also promotes calm, reducing stress hormones.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"air-purifiers", name:"Peace Lily (Air)", description:"A top NASA-ranked air purifier that removes benzene, formaldehyde, and trichloroethylene.", watering:"Once a week", light:"Low to Medium Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Croton (Air)", description:"A vibrant foliage plant that absorbs volatile organic compounds through its large, colourful leaf surfaces.", watering:"Twice a week", light:"Bright Direct Light", careLevel:"Moderate" },
  { category:"air-purifiers", name:"Philodendron Swiss Cheese", description:"A popular climbing houseplant that efficiently removes airborne toxins through its fenestrated leaves.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"ZZ Plant (Air)", description:"An exceptionally drought-tolerant air purifier that thrives in low light with minimal maintenance.", watering:"Once a month", light:"Low to Bright Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Dracaena Lemon Lime", description:"A striking variegated Dracaena that removes xylene, toluene, and formaldehyde from indoor air.", watering:"Once in 10 days", light:"Medium Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Philodendron Monstera", description:"A bold indoor statement plant whose large leaves make it a highly efficient natural air filter.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"air-purifiers", name:"Arrowhead Plant", description:"A versatile plant whose arrow-shaped leaves progressively develop lobes as it matures, filtering air.", watering:"Twice a week", light:"Low to Medium Indirect Light", careLevel:"Easy" },

  // ── Medical Herbs ─────────────────────────────────────────────────────────
  { category:"medical-herbs", name:"Tulsi", description:"India's most sacred herb, renowned for its adaptogenic, antimicrobial, and immune-boosting properties.", watering:"Three times a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Ashwagandha", description:"An ancient Ayurvedic root herb considered a powerful adaptogen that relieves stress and builds vitality.", watering:"Once a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"medical-herbs", name:"Amla", description:"A revered Ayurvedic fruit tree packed with Vitamin C, supporting immunity and hair health.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Neem", description:"A multifaceted medicinal tree whose leaves, bark, and oil offer antibacterial and antifungal properties.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Turmeric", description:"A tropical rhizomatous plant grown for its golden root, a potent anti-inflammatory culinary spice.", watering:"Twice a week", light:"Bright Indirect Light", careLevel:"Moderate" },
  { category:"medical-herbs", name:"Moringa", description:"A fast-growing nutritional powerhouse tree whose leaves, pods, and seeds are all edible and medicinal.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Brahmi", description:"A creeping aquatic herb traditionally used to improve memory, concentration, and nervous system function.", watering:"Three times a week", light:"Partial Shade", careLevel:"Moderate" },
  { category:"medical-herbs", name:"Giloy", description:"A climbing shrub hailed as the 'root of immortality' for its powerful immune-modulating effects.", watering:"Twice a week", light:"Partial Shade to Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Fenugreek", description:"A fast-growing annual herb whose seeds and leaves are staples in Indian cooking and herbal medicine.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Aloe Vera", description:"A succulent with thick, gel-filled leaves used for skin soothing, wound healing, and digestive health.", watering:"Once in 2 weeks", light:"Bright Direct Light", careLevel:"Easy" },
  { category:"medical-herbs", name:"Rosemary", description:"An aromatic Mediterranean herb with needle-like leaves used in cooking, aromatherapy, and hair care.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Lemon Grass", description:"A fragrant tropical grass with lemony-citrus scented stalks used in teas and traditional medicine.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Peppermint", description:"A vigorous spreading herb with intensely aromatic leaves widely used in teas, digestives, and cooling remedies.", watering:"Three times a week", light:"Partial Shade", careLevel:"Easy" },
  { category:"medical-herbs", name:"Marigold (Herb)", description:"Beyond its beauty, marigold's petals and leaves have antiseptic, anti-inflammatory, and skin-healing properties.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"medical-herbs", name:"Thyme", description:"A compact culinary herb packed with thymol, a natural antiseptic also used for respiratory health.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },

  // ── Outdoor Plants ────────────────────────────────────────────────────────
  { category:"outdoor-plants", name:"Bougainvillea (Outdoor)", description:"A vigorous thorny climber that smothers trellises and walls in brilliant papery bracts outdoors.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Areca Palm (Outdoor)", description:"A tall, feathery outdoor palm that creates tropical privacy screens and windbreaks.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Hibiscus (Outdoor)", description:"A garden staple with large showy flowers in bold reds and pinks, beloved in Indian homes.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Aloe Vera (Outdoor)", description:"A tough patio choice that handles intense midday sun waves with minimal root space.", watering:"Once in 2 weeks", light:"Bright Direct Light", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Money Plant (Outdoor)", description:"A robust climber capable of scaling brick walls or trailing gracefully out of porch hanging baskets.", watering:"Once a week", light:"Partial Shade to Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Jasmine (Outdoor)", description:"An absolute porch essential, filling Indian summer nights with an unmistakable, rich floral perfume.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Croton (Outdoor)", description:"An outdoor accent shrub that achieves its most brilliant, burning red-yellow pigmentation under full sun.", watering:"Twice a week", light:"Full Sun", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Ixora (Outdoor)", description:"A neat, naturally rounded formal border shrub that maintains compact structural shapes with ease.", watering:"Twice a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Rubber Plant (Outdoor)", description:"A fast-growing specimen tree when planted in the ground, developing massive tropical shade canopies.", watering:"Once a week", light:"Full Sun to Partial Shade", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Dracaena (Outdoor)", description:"A structural cane plant providing strong vertical lines and variegated leaf texture to garden beds.", watering:"Once in 10 days", light:"Partial Shade", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Agave", description:"A heavy, lethal-spined desert succulent that forms majestic, low-maintenance structural focal points.", watering:"Once a month", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Bamboo Plant", description:"A rapid-growing wooden grass variety ideal for establishing quick, tall green privacy screens.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Kalanchoe (Outdoor)", description:"A reliable winter-blooming succulent that accents balcony edges with dense, colorful floral bricks.", watering:"Once in 2 weeks", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Adenium (Outdoor)", description:"A favorite collector plant that rewards minimal watering with striking, sculpted, exposed root bases.", watering:"Once in 10 days", light:"Full Sun", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Lantana (Outdoor)", description:"An unkillable filler plant that easily covers rocky embankments and poor soils with continuous color.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Portulaca (Outdoor)", description:"The ultimate summer edge-planter choice, forming dense, weeping carpets of non-stop daily color.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Thuja (Outdoor)", description:"A formal, neat, symmetrical evergreen conifer that provides a stately structured look to driveways.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Ficus Panda", description:"A premium topiary selection with thick round leaves, highly favored for trimming into perfect green spheres.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Golden Duranta", description:"A bright, chartreuse-yellow hedging shrub used extensively to create clean, color-contrasting garden borders.", watering:"Once a week", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Palm Plants", description:"A diverse group of architectural fan and feather trees that instantly evoke a tropical landscape feel.", watering:"Twice a week", light:"Full Sun to Partial Shade", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Spider Plant (Outdoor)", description:"A classic cascading plant that sends out long arching runners tipped with mini-plantlets.", watering:"Once a week", light:"Bright Indirect Light", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Fern Plants", description:"A shade-loving collection prized for their delicate, arching, lace-patterned green fronds.", watering:"Three times a week", light:"Full Shade", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Caladium", description:"A spectacular shade bulb producing paper-thin leaves patterned in translucent pinks, whites, and greens.", watering:"Three times a week", light:"Partial to Full Shade", careLevel:"Moderate" },
  { category:"outdoor-plants", name:"Cactus Plants", description:"Specialized desert survivors featuring striking geometric ribs and protective spines instead of leaves.", watering:"Once a month", light:"Full Sun", careLevel:"Easy" },
  { category:"outdoor-plants", name:"Rose", description:"The classic thorny garden queen, requiring regular feeding to yield layered, fragrant blossoms.", watering:"Three times a week", light:"Full Sun", careLevel:"Hard" },
];

// ─── seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products with images…`);

  await db.delete(productsTable);
  await db.execute(sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`);
  console.log("Cleared existing products and reset ID sequence.");

  const rows = PRODUCTS.map((p) => {
    const pool = IMAGE_POOLS[p.category] ?? IMAGE_POOLS["bloom-throughout-year"];
    const imgs = pickImages(p.name, pool);
    return {
      name:        p.name,
      description: p.description,
      price:       price(p.category, p.careLevel, p.name),
      category:    p.category,
      stock:       stockCount(p.name),
      imageUrl:    imgs[0],
      imageUrls:   JSON.stringify(imgs),
      featured:    false,
      careLevel:   p.careLevel,
      sunlight:    p.light,
      watering:    p.watering,
    };
  });

  for (let i = 0; i < rows.length; i += 50) {
    await db.insert(productsTable).values(rows.slice(i, i + 50));
    console.log(`  Inserted rows ${i + 1}–${Math.min(i + 50, rows.length)}`);
  }

  console.log("Done! Total products inserted:", rows.length);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
