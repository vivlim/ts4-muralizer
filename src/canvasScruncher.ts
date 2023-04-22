import { PixelCrop } from 'react-image-crop'

const TO_RADIANS = Math.PI / 180

export async function canvasScruncher(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  inputWidth: number,
  targetWidth: number,
  height: number,
  rotate = 0,
) {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to
  // size the image back down if you want to download/upload and be
  // true to the images natural size.
  const pixelRatio = window.devicePixelRatio
  // const pixelRatio = 1

  canvas.width = targetWidth;
  canvas.height = height;

  ctx.scale(pixelRatio, pixelRatio)
  //ctx.scale(1, 1);
  ctx.imageSmoothingQuality = 'high'

  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY

  const rotateRads = rotate * TO_RADIANS
  const centerX = image.naturalWidth / 2
  const centerY = image.naturalHeight / 2

  ctx.save()

  const finalScaleX = targetWidth / inputWidth;

  const imageXScale = image.width / image.naturalWidth;
  const imageYScale = image.height / image.naturalHeight;

  /*
  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY)
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY)
  // 2) Scale the image
  ctx.scale(finalScaleX, 1)
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY)
  */
  ctx.drawImage(
    image,
    crop.x / imageXScale,
    crop.y / imageYScale,
    crop.width / imageXScale,
    crop.height / imageYScale,
    0,
    0,
    targetWidth,
    height,
  )

  ctx.restore()
}
