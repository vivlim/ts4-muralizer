import React, { useRef, useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import logo from './logo.svg';
import './App.css';
import 'react-image-crop/dist/ReactCrop.css'


import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
} from 'react-image-crop'


import 'react-image-crop/dist/ReactCrop.css'
import { cropImageToTargetDimensions } from './imageCropper';
import { Button, Paper, TextInput, Title, Text } from '@mantine/core';
import { AccumulatingAwaitableEvent } from './CustomAwaitableEvent';
import { useDebounceEffect } from 'ahooks';


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

export interface OutputImageSpec {
  width: number,
  height: number,
  name: string,
}

export interface OutputImage {
  name: string,
  blob: Blob,
}

interface CanvasProps {
  imgSrc: string,
  aspect: number,
  accumulator: AccumulatingAwaitableEvent<OutputImage>,
  outputSpecs: OutputImageSpec[],
  showDebugControls: boolean,
}

export default function CropCanvas({imgSrc, aspect, accumulator, outputSpecs, showDebugControls}: CanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [locked, setLocked] = useState<boolean>(false)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  async function handleTriggerCrop(): Promise<OutputImage[]> {
    const result = [];
    for (const spec of outputSpecs){
      result.push(await cropToSpec(spec));
    }
    return result;
  }

  async function handleClickDebugCropSingleSpec(spec: OutputImageSpec) {
    const image = await cropToSpec(spec);

    const blobUrl = URL.createObjectURL(image.blob);
    window.open(blobUrl, '_blank');
    URL.revokeObjectURL(blobUrl);
  }

  async function cropToSpec(spec: OutputImageSpec): Promise<OutputImage> {
    if (!imgRef.current){
      throw new Error("imageref is null");
    }
    if (!crop){
      throw new Error("crop is null");
    }
    const canvas = document.createElement("canvas");
    cropImageToTargetDimensions(imgRef.current, canvas, crop, spec.width, spec.height);

    const blob: Blob = await new Promise((resolve, error) => {
      canvas.toBlob((blob) => {
        if (!blob){
          error(new Error("Failed to create blob"));
        }
        else {
          resolve(blob);
        }
      });
    });

    return {
      name: spec.name,
      blob: blob
    }

  }

  useDebounceEffect(() => {
    accumulator.addEventProcessor(handleTriggerCrop)

    return () => {
      accumulator.removeEventProcessor(handleTriggerCrop)
    }
  }, [accumulator, crop], {wait: 100});

  React.useEffect(() => {
    // Reset crop if the requested aspect changes

    const width = imgRef.current?.width;
    const height = imgRef.current?.height;

    if (aspect && width && height) {
      setCrop(centerAspectCrop(width, height, aspect))
    }

  }, [aspect])

  return (
    <Paper shadow="xs" p="md">
      <ReactCrop
        crop={crop}
        onChange={(_, percentCrop) => setCrop(percentCrop)}
        aspect={aspect}
      >
        <img
          ref={imgRef}
          alt="Crop me"
          src={imgSrc}
          onLoad={onImageLoad}
        />
      </ReactCrop>
      <div style={{
        display: 'none'
      }}>
      </div>
      {showDebugControls && (
        <>

        <TextInput
          label="aspect"
          value={aspect}
          readOnly={true}
          />

        <TextInput
          label="crop details"
          value={JSON.stringify(crop)}
          readOnly={true}
          />

          {
            outputSpecs.map((spec, index) => (
              <>
            <TextInput
              label={`spec ${index}`}
              value={JSON.stringify(spec)}
              readOnly={true}
              />
            <Button onClick={() => handleClickDebugCropSingleSpec(spec)}>Crop & show result in new tab</Button>
              </>
            

            ))
          }
        </>

      )}
    </Paper>
  )
}
