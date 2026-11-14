'use client';

import NextImage, { type ImageProps } from 'next/image';

type AppImageProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'unoptimized'> & {
  src: string;
  width?: number | string;
  height?: number | string;
};

/**
 * A compatibility layer for responsive images that do not have intrinsic
 * dimensions at render time, such as user uploads and externally hosted media.
 * Remote URLs (object storage, CDNs) bypass the optimizer: the Next optimizer
 * fetches them from the server process, whose network (e.g. inside Docker)
 * may not resolve browser-facing hosts like localhost. Data and blob URLs
 * remain browser-local and therefore also bypass the optimizer.
 */
export default function AppImage({ src, width, height, ...props }: AppImageProps) {
  const isBrowserLocal = src.startsWith('data:') || src.startsWith('blob:');
  const isRemote = /^https?:\/\//i.test(src);
  const numericWidth = typeof width === 'number' ? width : 1;
  const numericHeight = typeof height === 'number' ? height : 1;

  return (
    <NextImage
      {...props}
      src={src}
      width={numericWidth}
      height={numericHeight}
      unoptimized={isBrowserLocal || isRemote}
    />
  );
}
