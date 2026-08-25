'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface GenerateOptions {
  size: number;
  color?: string;
  bgColor?: string;
  margin?: number;
}

export async function generateQrDataUrl(
  data: string,
  { size, color = '#1B2A5E', bgColor = '#ffffff', margin = 2 }: GenerateOptions
): Promise<string> {
  const dark = color.startsWith('#') ? color : `#${color}`;
  const lightBg = bgColor.startsWith('#') ? `${bgColor}FF` : bgColor;
  try {
    return await QRCode.toDataURL(data, {
      width: size * 2,
      margin,
      errorCorrectionLevel: 'M',
      color: { dark, light: lightBg },
    });
  } catch {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=${bgColor.replace('#', '')}&color=${color.replace('#', '')}&margin=${margin}`;
  }
}

export function useQrDataUrl(data: string, { size, color = '#1B2A5E', bgColor = '#ffffff', margin = 2 }: GenerateOptions): string {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!data) { setSrc(''); return; }
    let alive = true;
    const dark = color.startsWith('#') ? color : `#${color}`;
    const lightBg = bgColor.startsWith('#') ? `${bgColor}FF` : bgColor;

    QRCode.toDataURL(data, {
      width: size * 2,
      margin,
      errorCorrectionLevel: 'M',
      color: { dark, light: lightBg },
    })
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => {
        const remote = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=${bgColor.replace('#', '')}&color=${color.replace('#', '')}&margin=${margin}`;
        if (alive) setSrc(remote);
      });

    return () => { alive = false; };
  }, [data, size, color, bgColor, margin]);

  return src;
}

interface QrCodeProps {
  data: string;
  size: number;
  color?: string;
  bgColor?: string;
  margin?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export default function QrCode({
  data,
  size,
  color = '#1B2A5E',
  bgColor = '#ffffff',
  margin = 2,
  className,
  style,
  alt = 'QR code',
}: QrCodeProps) {
  const src = useQrDataUrl(data, { size, color, bgColor, margin });

  if (!src) {
    return <span style={{ display: 'inline-block', width: size, height: size, ...style }} className={className} aria-hidden />;
  }

  return <img src={src} width={size} height={size} className={className} style={style} alt={alt} />;
}
