import { useRef, useEffect, useState } from 'react';
import defaultImgSrc from './images/image_02.jpg';
import { Box, Button, Flex, Image, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text} from "@chakra-ui/react";
import { FaCompressAlt, FaFileImage } from 'react-icons/fa';
import { EnergyMap, IterationArgs, renderImage, Seam, Size } from './renderImage';

export const SeamCarver = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [imageUrl, setImageUrl] = useState(defaultImgSrc);
  const [originalDimensions, setOriginalDimensions] = useState('')
  const [finalSize, setFinalSize] = useState<Size | null>(null)
  const [widthInput, setWidthInput] = useState(50)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [seams, setSeams] = useState<Seam[] | null>(null);
  const [currImageSize, setCurrImageSize] = useState<Size | null>(null);
  const [percentage, setPercentage] = useState<number>(0);
  const [energy, setEnergy] = useState<EnergyMap | null>(null);
  const [final, setFinal] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState<Size | null>(null);
  //const [workingImgSize, setRunningSize] = useState<Size | null>(null);

  const handleClick = () => {
    if (inputRef.current){
      inputRef.current.click();
    }
  }

  const fileSelect = (files: FileList | null) => {
    if (!files || !files.length) {
      return;
    }
    const imageURL = URL.createObjectURL(files[0]);
    
    setImageUrl(imageURL)
  }

  const setSize = () => {
    if (imageRef.current) {
      setOriginalDimensions(imageRef.current.width + ' x ' + imageRef.current.height);
    }
    
  }

  const Iteration = async (args: IterationArgs) => {
    const {
      seam,
      image,
      energyMap,
      size,
      current,
      end
    } = args

    const  canvas = canvasRef.current;
    if (canvas) {
      canvas.width = size.w
      canvas.height = size.h

      const ctx = canvas.getContext('2d')
      
      if(ctx) {

        ctx.putImageData(image, 0, 0, 0, 0, size.w, size.h)

        setSeams([seam])
        setEnergy(energyMap)
        setCurrImageSize(size)
        setPercentage(current / end)
      }
    }
  }
  
  const finished = () => {
    const c = canvasRef.current
    if (c) {
      const type = 'Image/png'
      c.toBlob((blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob)
          setFinal(newUrl)
          setRunning(false)
          setDone(true)
          setFinalSize({
            w: c.width,
            h: c.height
          })
        }
      }, type)
    }
  }

  const Reset = () => {
    setFinal(null);
    setDone(false)
    setSeams(null);
    setCurrImageSize(null);
    setEnergy(null);
    setPercentage(0);
    setOriginalSize(null);
  }

  const resize = () => {
    const  canvas = canvasRef.current;
    const srcImage = imageRef.current;
    if (canvas && srcImage) {
      Reset()
      setRunning(true);

      let w = srcImage.width;
      let h = srcImage.height;
      const ratio = w/h;

      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(srcImage, 0, 0, w, h)
        const image = ctx.getImageData(0, 0, w, h)

        const newWidth = Math.floor((widthInput * w) / 100)

        renderImage({
          image,
          newWidth,
          Iteration
        }).then(() => {
          finished()
        });
      }
    }
    
  }

  return (
    <Box padding={8}>
      <Box marginBottom={'4'}>
        <Button
          onClick={handleClick}
          marginRight='5'
        >
          <FaFileImage />
          <Text marginLeft={'2'}><b>Upload Image</b></Text>
        </Button>
        <Button
          onClick={resize}
        >
          <FaCompressAlt/>
          <Text marginLeft={'2'}><b>Resize</b></Text>
        </Button>
        
        <input
          name='image_file'
          style={{display:'none'}}
          type={'file'}
          accept={'image/png,image/jpeg'}
          ref={inputRef}
          onChange={(e) => {
            const {files} = (e.target as HTMLInputElement);
            fileSelect(files)
          }}
        />
      </Box>

      <Box maxW={'600'} marginBottom='4'>
        <Flex>
          <Text marginRight={'3'} marginTop={'2'}>Width:</Text>
          <NumberInput maxW='100px' max={100} min={0} value={widthInput} isDisabled={running} onChange={(e) => {setWidthInput(Number(e))}}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text marginTop={'2'} marginRight={'10'} marginLeft='2'>%</Text>
          <Slider
            flex='1'
            focusThumbOnChange={false}
            value={widthInput}
            onChange={(e) => {setWidthInput(e)}}
            isDisabled={running}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb fontSize='sm' boxSize='32px' children={widthInput} />
          </Slider>
        </Flex>
        
      </Box>
      <Box hidden={!running}>
        <Text fontSize={'3xl'}><b>Rendering Image: </b></Text>
        <canvas ref={canvasRef}/>
      </Box>

      {done && final ?
        <Box>
          <Text fontSize={'3xl'}><b>Resized Image: </b></Text>
          <Image src={final}/>
          <Text><b>Resized Image Dimensions (W x H):</b> {finalSize?.w} x {finalSize?.h}</Text>
        </Box> :
        <Box></Box>
      }
      
      <Box>
        <Text fontSize={'3xl'}><b>Original Image:</b></Text>
        <Image marginBottom={'4'} ref={imageRef} src={imageUrl} onLoad={setSize}/>
        <Text><b>Original Image Dimensions (W x H):</b> {originalDimensions}</Text>
      </Box>
    </Box>
  );
};

