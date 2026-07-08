import React from "react";
import { Layout } from "@/components/Layout";
import { Leaf, User, MapPin, Clock, Phone, Mail } from "lucide-react";
import { StoreQRCode } from "@/components/StoreQRCode";

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">About Mother Nature</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A boutique nursery rooted in a love for plants, people, and the planet.
          </p>
        </div>

        {/* Story */}
        <section className="mb-12 space-y-4">
          <h2 className="font-serif text-2xl font-medium text-foreground">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mother Nature Nursery was born from a simple belief — that every home deserves a touch of
            green. We curate a hand-picked collection of plants, trees, and seeds suited to every
            environment: sunlit balconies, shaded living rooms, sprawling gardens, and everything in
            between.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From seasonal blooms to hardy air-purifying houseplants, our goal is to help you find
            exactly the right plant for your space, and to give you the knowledge to help it thrive.
          </p>
        </section>

        {/* What we offer */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-6">What We Offer</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Seasonal Flowers",    desc: "Summer, winter, and monsoon blooms grown fresh each season." },
              { title: "Year-Round Plants",   desc: "Varieties that flower throughout the year for constant colour." },
              { title: "Indoor & Outdoor",    desc: "Carefully selected plants for every light condition and space." },
              { title: "Air Purifiers",       desc: "NASA-recommended plants that clean the air in your home." },
              { title: "Medicinal Herbs",     desc: "Ayurvedic and culinary herbs grown without harmful chemicals." },
              { title: "Trees & Seeds",       desc: "Native trees and quality seeds for your garden or backyard." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-card border rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-6">Visit or Contact Us</h2>
          <div className="space-y-4">
            {[
              { icon: <User className="h-5 w-5 text-primary" />,    text: "Hareram Singh" },
              { icon: <MapPin className="h-5 w-5 text-primary" />,  text: "Main Road Bihta Chowk, Bihta – 801111" },
              { icon: <Clock className="h-5 w-5 text-primary" />,   text: "Mon – Sat: 9 AM – 7 PM  |  Sunday: 10 AM – 5 PM" },
              { icon: <Phone className="h-5 w-5 text-primary" />,   text: "+91 98765 43210" },
              { icon: <Mail className="h-5 w-5 text-primary" />,    text: "hello@mothernaturenursery.in" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <span className="text-sm text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Scan to visit */}
        <section className="mt-12 text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-2">Scan to Visit Us Online</h2>
          <p className="text-muted-foreground mb-6">
            Point your phone's camera at this code to open our shop right in your browser.
          </p>
          <StoreQRCode size={180} />
        </section>
      </div>
    </Layout>
  );
}
