import React, { useEffect, useRef, useState } from 'react';

/** Loads an image once per URL for the life of the page. */
const imageCache = new Map<string, HTMLImageElement>();

export function useImage(url: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => {
    const cached = url ? imageCache.get(url) : undefined;
    return cached?.complete && cached.naturalWidth > 0 ? cached : null;
  });
  useEffect(() => {
    if (!url) return;
    let image = imageCache.get(url);
    if (!image) {
      image = new Image();
      image.src = url;
      imageCache.set(url, image);
    }
    if (image.complete && image.naturalWidth > 0) {
      setImg(image);
      return;
    }
    const done = () => setImg(image!);
    image.addEventListener('load', done);
    return () => image!.removeEventListener('load', done);
  }, [url]);
  return img;
}

/**
 * A source rectangle of an atlas, drawn at an integer `scale`, or fitted into `fit` (a square box
 * in px, never enlarged past 2x) when given.
 */
export const AtlasCanvas: React.FC<{
  image: CanvasImageSource | null;
  rect: { x: number; y: number; w: number; h: number };
  scale?: number;
  fit?: number;
  className?: string;
}> = ({ image, rect, scale = 1, fit, className }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const k = fit ? Math.min(2, fit / Math.max(rect.w, rect.h)) : scale;
  const w = fit ?? rect.w * k;
  const h = fit ?? rect.h * k;
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = k < 1;
    if (!image) return;
    const dw = Math.round(rect.w * k);
    const dh = Math.round(rect.h * k);
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
  }, [image, rect.x, rect.y, rect.w, rect.h, k, w, h]);
  return <canvas ref={ref} width={w} height={h} className={className} style={{ imageRendering: k >= 1 ? 'pixelated' : 'auto' }} />;
};
