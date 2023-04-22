import React, { useRef, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import logo from './logo.svg';
import './App.css';
import 'react-image-crop/dist/ReactCrop.css'


import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'

import { canvasPreview } from './canvasPreview'
import { useDebounceEffect } from 'ahooks';

import 'react-image-crop/dist/ReactCrop.css'
import { Button, Container, FileButton, Grid, NativeSelect, NumberInput, TextInput } from '@mantine/core';
import { canvasScruncher } from './canvasScruncher';

const wallChoices = ["small", "medium", "tall"];

const wallSizes = {
  small: 768,
  medium: 1024,
  tall: 1280
}

const wallTileWidth = 256;

interface WallDimensions {
  height: number,
  totalWidth: number,
  tileCount: number,
  diffuseUvScale:  number,
}

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function App() {
  const [imgSrc, setImgSrc] = useState('')
  const fullWidthCanvasRef = useRef<HTMLCanvasElement>(null)
  const scrunchedCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(16 / 9)
  const [selectedWallSize, setWallSize] = useState(wallChoices[0])
  const [numTiles, setNumTiles] = useState<number | ''>(3)
  const [dimensions, setDimensions] = useState<WallDimensions>({height: wallSizes.small, totalWidth: wallTileWidth, tileCount: 1, diffuseUvScale: 0})
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [fullWidthPixelCrop, setFullWidthPixelCrop] = useState<PixelCrop>()
  const [scrunchedPixelCrop, setScrunchedPixelCrop] = useState<PixelCrop>()

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  function downloadCanvas(canvas: HTMLCanvasElement) {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob')
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
      blobUrlRef.current = URL.createObjectURL(blob)
      hiddenAnchorRef.current!.href = blobUrlRef.current
      hiddenAnchorRef.current!.click()
    })
  }

  function onDownloadFullWidthClick() {
    if (!fullWidthCanvasRef.current) {
      throw new Error('Crop canvas does not exist')
    }
    downloadCanvas(fullWidthCanvasRef.current);
  }

  function onDownloadScrunchedClick() {
    if (!scrunchedCanvasRef.current) {
      throw new Error('Crop canvas does not exist')
    }
    downloadCanvas(scrunchedCanvasRef.current);
  }

  useDebounceEffect(
    () => {
      if (
        fullWidthPixelCrop?.width &&
        fullWidthPixelCrop?.height &&
        imgRef.current &&
        fullWidthCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasScruncher(
          imgRef.current,
          fullWidthCanvasRef.current,
          fullWidthPixelCrop,
          dimensions.totalWidth,
          dimensions.totalWidth,
          dimensions.height,
          rotate,
        )
      }
    },
    [fullWidthPixelCrop, scale, rotate, crop, dimensions],
    {
      wait: 100,
    }
  )

  useDebounceEffect(
    () => {
      if (
        scrunchedPixelCrop?.width &&
        scrunchedPixelCrop?.height &&
        imgRef.current &&
        scrunchedCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasScruncher(
          imgRef.current,
          scrunchedCanvasRef.current,
          scrunchedPixelCrop,
          dimensions.totalWidth,
          dimensions.totalWidth / dimensions.tileCount,
          dimensions.height,
          rotate,
        )
      }
    },
    [fullWidthPixelCrop, scale, rotate, crop, dimensions],
    {
      wait: 100,
    }
  )

  React.useEffect(() => {
    var height: number | undefined;
    switch(selectedWallSize) {
      case 'small':
        height = wallSizes.small;
        break;
      case 'medium':
        height = wallSizes.medium;
        break;
      case 'tall':
        height = wallSizes.tall;
        break;
      default:
        break;
    }

    if (height === undefined){
      throw new Error("unknown wall size");
    }


    if (!(Number.isInteger(numTiles))){
      throw new Error("numtiles isn't set");
    }

    var newDimensions: WallDimensions = {
      height: height,
      tileCount: numTiles as number,
      totalWidth: wallTileWidth * (numTiles as number),
      diffuseUvScale: 1.0 / (numTiles as number),
    }

    setDimensions(newDimensions);

    if (imgRef.current){
      const { width, height } = imgRef.current
      var aspect = newDimensions.totalWidth / newDimensions.height;
      setAspect(aspect);
      var newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
    }
  }, [numTiles, selectedWallSize])

  React.useEffect(() => {
    if (inputFile !== null){
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(inputFile)
    }
  }, [inputFile])

  React.useEffect(() => {
    setFullWidthPixelCrop(completedCrop);
    setScrunchedPixelCrop(completedCrop);
  }, [completedCrop, dimensions])


  return (
    <ThemeProvider>
    <Grid>
      <Grid.Col span={2}>
        <FileButton
          onChange={setInputFile}
          accept="image/png,image.jpeg">
          {(props) => <Button {...props}>Upload image</Button>}
        </FileButton>
        <NativeSelect
          label="Wall height"
          data={wallChoices}
          value={selectedWallSize}
          onChange={(event) => setWallSize(event.currentTarget.value)}
        />
        <NumberInput
          value={numTiles}
          label="Number of tiles"
          onChange={setNumTiles}
        />
        <NumberInput
          value={dimensions.totalWidth}
          label="total width"
          readOnly={true}
        />
        <TextInput
          value={dimensions.diffuseUvScale}
          label="DiffuseUVScale"
          readOnly={true}
        />

          <div>
            <Button onClick={onDownloadFullWidthClick}>Download fullWidth</Button>
            <Button onClick={onDownloadScrunchedClick}>Download scrunched</Button>
            <a
              ref={hiddenAnchorRef}
              download
              style={{
                position: 'absolute',
                top: '-200vh',
                visibility: 'hidden',
              }}
            >
              Hidden download
            </a>
          </div>
      </Grid.Col>
      <Grid.Col span={6}>
      {!!imgSrc && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imgSrc}
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      )}
      {!!fullWidthPixelCrop && !!scrunchedPixelCrop && (
        <>
          <div>
            <canvas
              ref={fullWidthCanvasRef}
              style={{
                border: '1px solid black',
              }}
            />
          </div>
          <div>
            <canvas
              ref={scrunchedCanvasRef}
              style={{
                border: '1px solid black',
              }}
            />
          </div>
        </>
      )}
      </Grid.Col>
    </Grid>
</ThemeProvider>
  )
}
