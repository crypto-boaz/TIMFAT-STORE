"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function ProductQr({ barcode, size = 176 }: { barcode: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(barcode, { width: size, margin: 2, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [barcode, size]);

  if (!src) {
    return <div className="grid place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500" style={{ width: size, height: size }}>QR</div>;
  }

  return <img src={src} alt="QR code for barcode" width={size} height={size} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm" />;
}
