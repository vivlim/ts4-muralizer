import { Crop, PixelCrop } from 'react-image-crop'

const TO_RADIANS = Math.PI / 180

export function cropImageToTargetDimensions(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: Crop,
  targetWidth: number,
  height: number,
) {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  if (crop.unit !== "%"){
    throw new Error("Expected percent crop.");
  }

  // Crop is expressed in percents

  const cropX = crop.x / 100;
  const cropY = crop.y / 100;
  const cropWidth = crop.width / 100;
  const cropHeight = crop.height / 100;

  canvas.width = targetWidth;
  canvas.height = height;

  ctx.imageSmoothingQuality = 'high'

  // source from an unscaled image element, so we don't need to map those coordinates too
  const unscaledSource = new Image();
  unscaledSource.src = image.src;

  ctx.drawImage(
    unscaledSource,
    cropX * image.naturalWidth,
    cropY * image.naturalHeight,
    cropWidth * image.naturalWidth,
    cropHeight * image.naturalHeight,
    0,
    0,
    targetWidth,
    height,
  )
}
