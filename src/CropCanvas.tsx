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
import { Button, TextInput } from '@mantine/core';


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

interface OutputImageSpec {
  width: number,
  height: number,
  name: string,
}

interface OutputImage {
  name: string,
  blob: Blob,
}

interface CanvasProps {
  sectionLabel: string,
  helpLabel: string,
  imgSrc: string,
  aspect: number,
  triggerCropEventName: string,
  onCropCompleted: (n: OutputImage[]) => void,
  outputSpecs: OutputImageSpec[],
  showDebugControls: boolean,
}

export default function CropCanvas({imgSrc, aspect, triggerCropEventName, onCropCompleted, outputSpecs, showDebugControls}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [locked, setLocked] = useState<boolean>()

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  async function handleTriggerCrop() {
    console.log("cropping");

  }

  async function handleClickDebugCropSingleSpec(spec: OutputImageSpec) {
    const image = await cropToSpec(spec);

    const blobUrl = URL.createObjectURL(image.blob);
    window.open(blobUrl, '_blank');
    URL.revokeObjectURL(blobUrl);
  }

  async function cropToSpec(spec: OutputImageSpec): Promise<OutputImage> {
    if (locked) {
      throw new Error("control is already locked.");
    }
    setLocked(true);
    try {

      if (!imgRef.current){
        throw new Error("imageref is null");
      }
      if (!canvasRef.current){
        throw new Error("canvasref is null");
      }
      if (!crop){
        throw new Error("crop is null");
      }
      cropImageToTargetDimensions(imgRef.current, canvasRef.current, crop, spec.width, spec.height);

      const blob: Blob = await new Promise((resolve, error) => {
        if (!canvasRef.current){
          error(new Error("canvasref is null inside of retrieving the blob."));
        }
        canvasRef.current?.toBlob((blob) => {
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
    finally {
      setLocked(false);

    }
  }

  React.useEffect(() => {
    const handler = () => handleTriggerCrop();
    document.addEventListener(triggerCropEventName, handler);

    return () => {
      document.removeEventListener(triggerCropEventName, handler);
    }
  }, [triggerCropEventName])

  React.useEffect(() => {
    // Reset crop if the requested aspect changes

    const width = imgRef.current?.width;
    const height = imgRef.current?.height;

    if (aspect && width && height) {
      setCrop(centerAspectCrop(width, height, aspect))
    }

  }, [aspect])

  return (
    <>
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
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid black',
          }}
        />
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
    </>
  )
}
