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
import { AppShell, Aside, Button, Container, FileButton, Grid, Header, NativeSelect, Navbar, NavLink, NumberInput, Paper, Switch, Image, TextInput, Title, Text, Center, Tooltip, Mark, Anchor } from '@mantine/core';
import CropCanvas, { OutputImage } from './CropCanvas';
import WallHeightCropControl from './WallHeightCropControl';
import { ExportCropsEvent } from './Events';
import { downloadZipWithFiles } from './MakeZip';

const wallChoices = ["short", "medium", "tall"];

const pageList = [
  "1. Introduction",
  "2. Select an image",
  "3. Adjust crop for wall heights",
  "4. Import images into Sims4Studio",
  "5. Adjust UV scale"
];

const wallSizes = {
  short: 768,
  medium: 1024,
  tall: 1280
}

const wallTileWidth = 256;

interface WallDimensions {
  height: number,
  totalWidth: number,
  tileCount: number,
  diffuseUvScale: number,
}

interface WallUvScaleHelpInfo {
  label: string,
  width: number,
  numTiles: number,
  diffuseUvScale: number,
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
  const [unlockedPage, setUnlockedPage] = useState(1)
  const [imgSrc, setImgSrc] = useState('')
  const fullWidthCanvasRef = useRef<HTMLCanvasElement>(null)
  const scrunchedCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef('')
  const [aspect, setAspect] = useState<number | undefined>(16 / 9)
  const [selectedWallSize, setWallSize] = useState(wallChoices[0])
  const [numTiles, setNumTiles] = useState<number | ''>(3)
  const [dimensions, setDimensions] = useState<WallDimensions>({ height: wallSizes.short, totalWidth: wallTileWidth, tileCount: 1, diffuseUvScale: 0 })
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [showCalculations, setShowCalculations] = useState<boolean>(false)
  const [allImages, setAllImages] = useState<OutputImage[]>([]);
  const [scaleHelpInfo, setScaleHelpInfo] = useState<WallUvScaleHelpInfo[]>([]);

  async function onDoCropClick() {
    const allImages = await ExportCropsEvent.signalAndWaitForAllProcessors();
    console.log(`got ${allImages.length} images`);
    setAllImages(allImages);
    await downloadZipWithFiles("wall.zip", allImages);
    setActivePage(3);
    setUnlockedPage(3);
  }

  React.useEffect(() => {
    var height: number | undefined;
    switch (selectedWallSize) {
      case 'short':
        height = wallSizes.short;
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

    if (height === undefined) {
      throw new Error("unknown wall size");
    }


    if (!(Number.isInteger(numTiles))) {
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
    if (inputFile !== null) {
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(inputFile)

      setActivePage(2);
      setUnlockedPage(2);
    }
  }, [inputFile])

  React.useEffect(() => {
    let newScaleHelpInfo: WallUvScaleHelpInfo[] = [];
    for (const image of allImages) {
      let label = "";
      if (image.name.includes("short")) {
        label = "short";
      } else if (image.name.includes("medium")) {
        label = "medium";
      } else if (image.name.includes("tall")) {
        label = "tall";
      } else {
        continue;
      }

      newScaleHelpInfo.push({
        label: label,
        width: image.width,
        numTiles: image.width / wallTileWidth,
        diffuseUvScale: 1.0 / (image.width / wallTileWidth)
      });

      setScaleHelpInfo(newScaleHelpInfo);
    }
  }, [allImages])


  const navItems = pageList.map((page, index) => (
    <NavLink
      key={page}
      active={index === activePage}
      label={page}
      onClick={() => setActivePage(index)}
      disabled={index > unlockedPage && !debugMode}
    />
  ))


  return (
    <ThemeProvider>
      <AppShell
        padding="md"
        navbar={<Navbar width={{ base: 300 }} height={500} p="xs">
          <Navbar.Section>
            <Title order={4}>Steps</Title>
          </Navbar.Section>
          <Navbar.Section grow>
            {navItems}
          </Navbar.Section>
          <Navbar.Section>
            <Switch p="sm" checked={showCalculations} onChange={(event) => setShowCalculations(event.currentTarget.checked)} label="Show calculations" />
            <Switch p="sm" checked={debugMode} onChange={(event) => setDebugMode(event.currentTarget.checked)} label="Show extra debug controls" />
          </Navbar.Section>
        </Navbar>}
        header={<Header height={60} p="xs">
          <Center>
            <Title order={2}>🖼 multi-tile mural factory 🏭</Title>
          </Center>
        </Header>}
        styles={(theme) => ({
          main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
        })}
      >
        {activePage == 0 && (
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              <p>Hi! This is a tool to help with creating wallpapers for The Sims 4 that span across multiple tiles.</p>
              <p>The technique used is a <Tooltip label="specifically, I found that I didn't need to create the resized versions of the textures" inline><Mark>slight modification</Mark></Tooltip> of <Anchor href="https://anachrosims.tumblr.com/post/641336721000333312/ts4-cc-tutorial-how-to-make-a-multi-tile-mural" target="_blank">anachrosims' "How to make a multi-tile mural" tutorial</Anchor>, which I recommend reading before continuing.</p>
              

            </Text>
          </Paper>
        )}
        {activePage == 1 && (
          <>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              Any files you upload never leave your computer; all processing happens within your browser.
            </Text>
          </Paper>
          <FileButton
            onChange={setInputFile}
            accept="image/png,image.jpeg">
            {(props) => <Button {...props}>Upload image</Button>}
          </FileButton>
          </>
        )}
        {activePage == 2 && (
          <Grid>
            <Grid.Col span={6}>
              {!!imgSrc && (
                <>
                  <Paper shadow="xs" p="md" m="sm" withBorder>
                    <Text fz="lg">For each different wall height, select how many tiles to use, and which portion of your image will be used.</Text>
                  </Paper>
                  <WallHeightCropControl
                    sectionLabel='Short walls'
                    helpLabel='Move the slider to choose how many tiles to use for short walls. Drag the image to select a portion of the image to use.'
                    imgSrc={imgSrc}
                    tileWidth={wallTileWidth}
                    tileHeight={wallSizes.short}
                    outputFileLabel="short.png"
                    accumulator={ExportCropsEvent}
                    showDebugControls={debugMode}
                    showCalculations={showCalculations}
                  />
                  <WallHeightCropControl
                    sectionLabel='Medium walls'
                    helpLabel='Move the slider to choose how many tiles to use for medium walls. Drag the image to select a portion of the image to use.'
                    imgSrc={imgSrc}
                    tileWidth={wallTileWidth}
                    tileHeight={wallSizes.medium}
                    outputFileLabel="medium.png"
                    accumulator={ExportCropsEvent}
                    showDebugControls={debugMode}
                    showCalculations={showCalculations}
                  />
                  <WallHeightCropControl
                    sectionLabel='Tall walls'
                    helpLabel='Move the slider to choose how many tiles to use for tall walls. Drag the image to select a portion of the image to use.'
                    imgSrc={imgSrc}
                    tileWidth={wallTileWidth}
                    tileHeight={wallSizes.tall}
                    outputFileLabel="tall.png"
                    accumulator={ExportCropsEvent}
                    showDebugControls={debugMode}
                    showCalculations={showCalculations}
                  />

                  <Paper shadow="xs" p="md" m="sm" withBorder>
                    <Title order={3}>Catalog thumbnail</Title>
                    <Text fz="m">Drag to select a portion of the image to use as a catalog thumbnail.</Text>

                    <Center>
                      <Paper shadow="xs" m="xs" withBorder>
                        <CropCanvas
                          imgSrc={imgSrc}
                          aspect={1}
                          accumulator={ExportCropsEvent}
                          outputSpecs={[{
                            width: 116,
                            height: 116,
                            name: "thumbnail.png"
                          }]}
                          showDebugControls={debugMode}
                        />
                      </Paper></Center>
                  </Paper>
                  <Paper shadow="xs" p="md" m="sm" withBorder>
                    <Text fz="lg">When you're ready, click this to continue:</Text>
                    <Button onClick={onDoCropClick}>Download a zip file containing these cropped images</Button>
                  </Paper>
                </>
              )}
            </Grid.Col>
          </Grid>)}
        {activePage == 3 && (
          <>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              Extract the .zip file that you just downloaded. It should contain the cropped images you selected just now.
            </Text>
            <img src="/images/unzipped.jpg" alt="Screenshot of an extracted zip that contained medium.png, short.png, tall.png, and thumbnail.png"/>
          </Paper>

          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              Start Sims 4 Studio, make sure that "Standalone Recolor" is selected, and click Build.
            </Text>
            <img src="/images/s4s_start.jpg" alt="Screenshot of Sims 4 Studio's start screen, with an arrow pointing at the Build button"/>
          </Paper>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              Choose an appropriate wallpaper to base yours on. If you just want a flat color, one of the "Pure Expressions" options from the base game works nicely.
            </Text>
            <img src="/images/s4s_select_base.jpg" alt="Selecting the gray Pure Expressions wall covering"/>
            <Text fz="lg">
              After selecting one, click Next and save your new .package file.
            </Text>
          </Paper>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              Change the Name and Description to something you like. Then, click the Texture tab.
            </Text>
            <img src="/images/s4s_texture.jpg" alt="Moving to the Texture tab in Sims 4 Studio"/>
            <Text fz="xl">⚠ Make sure that 'Autoresize Textures' is unchecked, or your texture will be stretched.</Text>
            <Text fz="lg">
              Now we'll import the images that you cropped earlier. First, click 'Short', then 'Import', and pick the 'short.png' that you extracted from the .zip.
            </Text>
            <Text fz="lg">
              Repeat this for 'Medium' and 'medium.png', as well as 'Tall' and 'tall.png.'
            </Text>
            <Text fz="lg">
              Also, click 'Import' within the 'Catalog Thumbnail' section and select 'thumbnail.png'. Afterwards, Sims 4 Studio should look like this:
            </Text>
            <img src="/images/s4s_imported.jpg" alt="Sims 4 Studio after importing the images."/>
            <Text fz="lg">
              The images you imported will appear squashed and repeating in the preview viewport. This is OK.
            </Text>
          </Paper>
            <Paper shadow="xs" p="md" m="sm" withBorder>
              <Button onClick={() => setActivePage(4)}>Continue to adjusting the UV scale</Button>
            </Paper>
          </>
        )}

        {activePage == 4 && (
          <>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Text fz="lg">
              To make the textures display at the desired width, we need to adjust the
              horizontal <Tooltip label="The texture which controls the visible color of an object" inline><Mark>diffuse</Mark></Tooltip> <Tooltip label="controls how the texture is applied to the surface of an object" inline><Mark>UV scale</Mark></Tooltip>.
            </Text>
            <Text fz="lg">
              Click the 'Warehouse' tab in Sims 4 Studio.
            </Text>
            <img src="/images/s4s_warehouse.jpg" alt="Navigating to the Warehouse tab"/>
            <Text fz="lg">
              There are three Material Definitions defined, each of these controls how the material is displayed on a different wall height. The first is for short walls, the second is for medium walls, and the third is for tall walls.
            </Text>
            <Text fz="lg">
              For each Material Definition, click it, and then click the 'Edit Items...' button on the left.
            </Text>
            <img src="/images/s4s_edituvscale.jpg" alt="Navigating to the Warehouse tab"/>
            <Text fz="lg">
              Now, click on the '<Tooltip label="Scale factors that control how the texture is applied to each wall segment." inline><Mark>DiffuseUVScale</Mark></Tooltip>' row on the left. The right side will change to allow you to modify DiffuseUVScale.
            </Text>
            <Text fz="lg">
              Click the box next to the [0], and replace the number there with one of the following, depending on whether you are looking at the first, second, or third Material Definition:
            </Text>
            {
              scaleHelpInfo.map(help => (
                <Text fz="lg">
                  {help.label}: <i>1 ÷ {help.numTiles} tiles</i> = <b>{help.diffuseUvScale}</b>
                </Text>
              ))
            }
            <Text fz="lg">
              be sure to add color tags to make it easier to find ingame
            </Text>
          <Paper shadow="xs" p="md" m="sm" withBorder>
            <Title order={4}>🤔 How does this work?</Title>
            <Text fz="lg">
              <p>
                DiffuseUVScale is an <Tooltip label="Collection of values, usually more than one" inline><Mark>array</Mark></Tooltip> of two <Tooltip label="Numbers that can contain a decimal point and be fractions, not restricted to whole numbers." inline><Mark>floating-point numbers</Mark></Tooltip>. We're interested in the 0th <Tooltip label="A number that represents a specific spot within the array, where the counting starts at 0. 0 is the first spot, 1 is the second spot, and so on." inline><Mark>index</Mark></Tooltip>, which should be 1 currently. The value at that index is the horizontal scale.
              </p>
              <p>
                A horizontal scale value of 1 means that for each wall tile, the texture should be used exactly once. If you were to set the value to 2, the texture would be repeated twice horizontally for each tile, which is the opposite of what we want.
              </p>
              <p>
                By making the scale <i>less than</i> 1, the texture will be able to occupy more than one tile. For example, a scale of 0.5 would result in half of the texture being drawn on a single tile - and that leaves the other half of the texture to be drawn on the <i>next</i> tile. 
              </p>
            </Text>
            </Paper>
          </Paper>
          </>
          )}
      </AppShell>
    </ThemeProvider>
  )
}
