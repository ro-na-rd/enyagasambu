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
 * Next Image provides optimized delivery for configured remote hosts. Data and
 * blob URLs remain browser-local and therefore bypass the optimizer.
 */
export default function AppImage({ src, width, height, ...props }: AppImageProps) {
  const isBrowserLocal = src.startsWith('data:') || src.startsWith('blob:');
  const numericWidth = typeof width === 'number' ? width : 1;
  const numericHeight = typeof height === 'number' ? height : 1;

  return (
    <NextImage
      {...props}
      src={src}
      width={numericWidth}
      height={numericHeight}
      unoptimized={isBrowserLocal}
    />
  );
}
