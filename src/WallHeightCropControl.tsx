import React, { useRef, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import logo from './logo.svg';
import './App.css';
import 'react-image-crop/dist/ReactCrop.css'




import 'react-image-crop/dist/ReactCrop.css'
import { Paper, Title, Text, Slider, NumberInput, TextInput, Flex, Center } from '@mantine/core';
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
  showCalculations: boolean
}

export default function WallHeightCropControl({ sectionLabel, helpLabel, imgSrc, tileWidth, tileHeight, outputFileLabel, accumulator, showDebugControls, showCalculations }: WallHeightControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [numTiles, setNumTiles] = useState<number>(3)
  const shortCanvasRef = useRef<typeof CropCanvas>(null);

  const outputWidth = (numTiles * tileWidth);
  const outputHeight = tileHeight;
  const aspectRatio = outputWidth / outputHeight;

  const numTilesLabel = (value: number) => `${value} tile${value > 1 ? 's' : ''}`

  return (
    <Paper shadow="xs" p="md" m="sm" withBorder>
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
      <Center>
        <Paper shadow="xs" m="xs" withBorder>
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
      </Center>
      {showCalculations && (
        <>
          <Paper shadow="xs" p="md">
            <Flex
              mih={80}
              bg="rgba(0, 0, 0, .3)"
              gap="md"
              justify="center"
              align="center"
              direction="row"
              wrap="wrap"
            >
              <TextInput
                label="Tile width"
                value={tileWidth}
                readOnly />
              <Text fz="xl">x</Text>
              <TextInput
                label="Number of tiles"
                value={numTiles}
                readOnly />
              <Text fz="xl">=</Text>
              <TextInput
                label="Image width"
                value={tileWidth * numTiles}
                readOnly />
            </Flex>
            <Flex
              mih={80}
              bg="rgba(0, 0, 0, .3)"
              gap="md"
              justify="center"
              align="center"
              direction="row"
              wrap="wrap"
            >

              <Text fz="xl">1 /</Text>
              <TextInput
                label="Number of tiles"
                value={numTiles}
                readOnly />
              <Text fz="xl">=</Text>
              <TextInput
                label="Horizontal UV scale"
                value={1.0 / numTiles}
                readOnly />
            </Flex>
          </Paper>
        </>
      )}
    </Paper>
  )
}
