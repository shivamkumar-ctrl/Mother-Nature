import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function getStoreUrl() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/`;
}

interface StoreQRCodeProps {
  size?: number;
  showDownload?: boolean;
  className?: string;
}

export function StoreQRCode({ size = 160, showDownload = false, className }: StoreQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeUrl = getStoreUrl();

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "mother-nature-store-qr-code.png";
    link.click();
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <div className="bg-white p-3 rounded-xl border shadow-sm inline-block">
        <QRCodeCanvas ref={canvasRef} value={storeUrl} size={size} level="M" marginSize={0} />
      </div>
      <p className="text-xs text-muted-foreground break-all text-center max-w-[240px]">{storeUrl}</p>
      {showDownload && (
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      )}
    </div>
  );
}
