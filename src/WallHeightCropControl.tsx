import React, { useRef, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import logo from './logo.svg';
import './App.css';
import 'react-image-crop/dist/ReactCrop.css'




import 'react-image-crop/dist/ReactCrop.css'
import { Paper, Title, Text, Slider } from '@mantine/core';
import CropCanvas, { OutputImage } from './CropCanvas';
import { ExportCropsEvent } from './Events';
import { AccumulatingAwaitableEvent } from './CustomAwaitableEvent';

interface WallHeightControlProps {
  sectionLabel: string,
  helpLabel: string,
  imgSrc: string,
  tileWidth: number,
  tileHeight: number,
  outputFileLabel: string,
  accumulator: AccumulatingAwaitableEvent<OutputImage>,
  showDebugControls: boolean,
}

export default function WallHeightCropControl({sectionLabel, helpLabel, imgSrc, tileWidth, tileHeight, outputFileLabel, accumulator, showDebugControls}: WallHeightControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [numTiles, setNumTiles] = useState<number>(3)
  const smallCanvasRef = useRef<typeof CropCanvas>(null);

  const outputWidth = (numTiles * tileWidth);
  const outputHeight = tileHeight;
  const aspectRatio = outputWidth / outputHeight;

  const numTilesLabel = (value: number) => `${value} tile${value > 1 ? 's' : ''}`

  return (
    <Paper shadow="xs" p="md">
      <Title order={3}>{sectionLabel}</Title>
      <Text fz="m">{helpLabel}</Text>

      <Title order={5}>Number of tiles</Title>
        <Slider
          value={numTiles}
          onChange={setNumTiles}
          defaultValue={3}
          min={1}
          max={15}
          label={(numTilesLabel)}
          labelTransition="skew-down"
          labelTransitionDuration={150}
          labelTransitionTimingFunction="ease"
          step={1}

        />
        <Text fz="m">{`The selected area will span ${numTilesLabel(numTiles)} at this height. The resulting image will be ${outputWidth}px wide and ${outputHeight}px tall.`}</Text>

        <CropCanvas
          imgSrc={imgSrc}
          aspect={aspectRatio}
          accumulator={accumulator}
          outputSpecs={[{
            width: outputWidth,
            height: outputHeight,
            name: `${outputFileLabel}`
          }]}
          showDebugControls={showDebugControls}
          />
    </Paper>
  )
}
