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

import { useDebounceEffect } from 'ahooks';

import 'react-image-crop/dist/ReactCrop.css'
import { AppShell, Button, Container, FileButton, Grid, Header, NativeSelect, Navbar, NavLink, NumberInput, TextInput } from '@mantine/core';
import { cropImageToTargetDimensions } from './imageCropper';
import CropCanvas from './CropCanvas';

const wallChoices = ["small", "medium", "tall"];

const pageList = [
  "1. Load image",
  "2. Adjust crop",
  "3. s4s"
];

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
  const [activePage, setActivePage] = useState(0)
  const [imgSrc, setImgSrc] = useState('')
  const fullWidthCanvasRef = useRef<HTMLCanvasElement>(null)
  const scrunchedCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef('')
  const [aspect, setAspect] = useState<number | undefined>(16 / 9)
  const [selectedWallSize, setWallSize] = useState(wallChoices[0])
  const [numTiles, setNumTiles] = useState<number | ''>(3)
  const [dimensions, setDimensions] = useState<WallDimensions>({height: wallSizes.small, totalWidth: wallTileWidth, tileCount: 1, diffuseUvScale: 0})
  const [inputFile, setInputFile] = useState<File | null>(null)


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

  function onDoCropClick() {
    document.dispatchEvent(new Event("triggerCrop"));
    
  }

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

    var aspect = newDimensions.totalWidth / newDimensions.height;
    setAspect(aspect);
    }, [numTiles, selectedWallSize])

  React.useEffect(() => {
    if (inputFile !== null){
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(inputFile)
    }
  }, [inputFile])


  const navItems = pageList.map((page, index) => (
    <NavLink
      key={page}
      active={index===activePage}
      label={page}
      onClick={() => setActivePage(index)}
      />
  ))


  return (
    <ThemeProvider>
      <AppShell
        padding="md"
        navbar={<Navbar width={{ base: 300 }} height={500} p="xs">
                {navItems}
               </Navbar>}
        header={<Header height={60} p="xs">{/* Header content */}</Header>}
        styles={(theme) => ({
          main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
        })}
      >
        { activePage == 0 && (
          <FileButton
            onChange={setInputFile}
            accept="image/png,image.jpeg">
            {(props) => <Button {...props}>Upload image</Button>}
          </FileButton>
        )}
        { activePage == 1 && (
    <Grid>
      <Grid.Col span={2}>
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
        <NumberInput
          value={dimensions.height}
          label="height"
          readOnly={true}
        />
        <TextInput
          value={dimensions.diffuseUvScale}
          label="DiffuseUVScale"
          readOnly={true}
        />

          <div>
            <Button onClick={onDownloadFullWidthClick}>Download fullWidth</Button>
            <Button onClick={onDoCropClick}>do it</Button>
          </div>
      </Grid.Col>
      <Grid.Col span={6}>
      {!!imgSrc && (
        <CropCanvas
          sectionLabel='section'
          helpLabel='help'
          imgSrc={imgSrc}
          aspect={dimensions.totalWidth / dimensions.height}
          triggerCropEventName="triggerCrop"
          onCropCompleted={(n)=> console.log("handlign onCropCompoleted")}
          outputSpecs={[{
            width: dimensions.totalWidth,
            height: dimensions.height,
            name: "normal"
          }]}
          showDebugControls={true}
          />
      )}
      </Grid.Col>
    </Grid>)}
    {activePage == 2 && (
      <div>
        todo: instructions
      </div>
    )}
    </AppShell>
</ThemeProvider>
  )
}
