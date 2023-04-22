import { PixelCrop } from 'react-image-crop'

const TO_RADIANS = Math.PI / 180

export async function cropImageToTargetDimensions(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  targetWidth: number,
  height: number,
) {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = targetWidth;
  canvas.height = height;

  ctx.imageSmoothingQuality = 'high'
  // need to convert pixels in the crop widget to the natural dimensions of the image
  const imageXScale = image.width / image.naturalWidth;
  const imageYScale = image.height / image.naturalHeight;

  // source from an unscaled image, so we don't need to map those coordinates too
  const unscaledSource = new Image();
  unscaledSource.src = image.src;

  ctx.drawImage(
    unscaledSource,
    crop.x / imageXScale,
    crop.y / imageYScale,
    crop.width / imageXScale,
    crop.height / imageYScale,
    0,
    0,
    targetWidth,
    height,
  )
}
