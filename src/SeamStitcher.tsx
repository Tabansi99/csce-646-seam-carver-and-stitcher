import { Box, Button, Grid, GridItem, Image, Text } from "@chakra-ui/react"
import { useRef, useState } from "react";
import { FaCompressAlt, FaFileImage, FaMixer } from "react-icons/fa";
import defaultLeftImgSrc from './images/face3.jpg'
import defaultRightImgSrc from './images/face3_tilt.jpg'
import { Coordinate, findSeam, getPixel, matrix, setPixel } from "./renderImage";

export const SeamStitch = () => {
  const leftInputRef = useRef<HTMLInputElement>(null)
  const rightInputRef = useRef<HTMLInputElement>(null)
  const leftImageRef = useRef<HTMLImageElement>(null)
  const rightImageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [leftImageUrl, setLeftImageUrl] = useState(defaultLeftImgSrc);
  const [rightImageUrl, setRightImageUrl] = useState(defaultRightImgSrc);
  const [rightOriginalDimensions, setRightOriginalDimensions] = useState('')
  const [leftOriginalDimensions, setLeftOriginalDimensions] = useState('')
  const [merged, setMerged] = useState(false)
  const [mergedURL, setMergedURL] = useState('')
  const [mergedDimensions, setMergedDimensions] = useState('')

  const LeftHandleClick = () => {
    if (leftInputRef.current){
      leftInputRef.current.click();
    }
  }

  const RightHandleClick = () => {
    if (rightInputRef.current){
      rightInputRef.current.click();
    }
  }

  const LeftFileSelect = (files: FileList | null) => {
    if (!files || !files.length) {
      return;
    }
    const imageURL = URL.createObjectURL(files[0]);
    
    setLeftImageUrl(imageURL)
  }

  const RightFileSelect = (files: FileList | null) => {
    if (!files || !files.length) {
      return;
    }
    const imageURL = URL.createObjectURL(files[0]);
    
    setRightImageUrl(imageURL)
  }

  const SetLeftSize = () => {
    if (leftImageRef.current) {
      setLeftOriginalDimensions(leftImageRef.current.width + ' x ' + leftImageRef.current.height);
    }
  }

  const SetRightSize = () => {
    if (rightImageRef.current) {
      setRightOriginalDimensions(rightImageRef.current.width + ' x ' + rightImageRef.current.height);
    }
  }

  const Merge = (event: React.SyntheticEvent) => {
    if (rightImageRef.current && leftImageRef.current) {
      const rightImgRef = rightImageRef.current
      const leftImgRef = leftImageRef.current

      if ((rightImgRef.width != leftImgRef.width) || (leftImgRef.height != rightImgRef.height)) {
        alert("Error: Please ensure the two images have the same dimendsions!")
        event.preventDefault();
        return
      }

      const canvas = canvasRef.current;

      if (canvas) {
        let w = leftImgRef.width
        let h = rightImgRef.height

        canvas.width = w
        canvas.height = h

        const ctxLeft = canvas.getContext('2d')
        //const ctxRight = canvas.getContext('2d')

        if (ctxLeft) {
          ctxLeft.drawImage(leftImgRef, 0, 0, w, h)
          const leftImg = ctxLeft.getImageData(0, 0, w, h)

          const ctxRight = canvas.getContext('2d')
          if (ctxRight) {
            ctxRight.drawImage(rightImgRef, 0, 0, w, h)
            const rightImg = ctxRight.getImageData(0, 0, w, h)

            const energyMap: number[][] = matrix<number>(w, h, Infinity);

            for (let y = 0; y < h; y += 1) {
              for (let x = 0; x < w; x += 1) {
                const left = getPixel(leftImg, {x, y})
                const right = getPixel(rightImg, {x, y})

                const [lR, lG, lB] = left;
                const [rR, rG, rB] = right;

                energyMap[y][x] = (lR - rR) ** 2 + (lG - rG) ** 2 + (lB - rB) ** 2
              }
            }

            const seam = findSeam(energyMap, {w, h})

            seam.forEach(({ x: seamX, y: seamY }: Coordinate) => {
              for (let x = seamX; x < w; x += 1) {
                const nextPixel = getPixel(rightImg, { x: x, y: seamY });
                setPixel(leftImg, { x, y: seamY }, nextPixel);
              }
            })

            const ctx = canvas.getContext('2d')

            if (ctx) {
              ctx.putImageData(leftImg, 0, 0, 0, 0, w, h)
            }

            const type = 'Image/png'
            canvas.toBlob((blob) => {
              if (blob) {
                const newURL = URL.createObjectURL(blob)
                setMergedURL(newURL)
                setMergedDimensions(w + ' x ' + h)
              }
            }, type)

          }
        }
      }
    }
  }

  return(
    <Box padding={8}>
      <Box marginBottom={'4'}>
        <Grid templateColumns='repeat(2, 1fr)' gap={6}>
          <GridItem w='100%'>
            <Box>
              <Button
                onClick={LeftHandleClick}
                marginRight='5'
              >
                <FaFileImage />
                <Text marginLeft={'2'}><b>Upload Image</b></Text>
              </Button>
              
              <input
                style={{display:'none'}}
                type={'file'}
                accept={'image/png,image/jpeg'}
                ref={leftInputRef}
                onChange={(e) => {
                  const {files} = (e.target as HTMLInputElement);
                  LeftFileSelect(files)
                }}
              />

              <Box>
                <Text fontSize={'3xl'}><b>Original Left Image:</b></Text>
                <Image marginBottom={'4'} ref={leftImageRef} src={leftImageUrl} onLoad={SetLeftSize}/>
                <Text><b>Original Image Dimensions (W x H):</b> {leftOriginalDimensions}</Text>
              </Box>
            </Box>
          </GridItem>

          <GridItem w='100%'>
            <Box>
              <Button
                onClick={RightHandleClick}
                marginRight='5'
              >
                <FaFileImage />
                <Text marginLeft={'2'}><b>Upload Image</b></Text>
              </Button>
              
              <input
                style={{display:'none'}}
                type={'file'}
                accept={'image/png,image/jpeg'}
                ref={rightInputRef}
                onChange={(e) => {
                  const {files} = (e.target as HTMLInputElement);
                  RightFileSelect(files)
                }}
              />

              <Box>
                <Text fontSize={'3xl'}><b>Original Right Image:</b></Text>
                <Image marginBottom={'4'} ref={rightImageRef} src={rightImageUrl} onLoad={SetRightSize}/>
                <Text><b>Original Right Image Dimensions (W x H):</b> {rightOriginalDimensions}</Text>
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Box>
      <Box margin={8} textAlign={'center'}>
        <Button
          onClick={(e) => {
            setMerged(true)
            Merge(e)
          }}
        >
          <Text marginRight={'2'}><b>MERGE</b></Text>
          <FaMixer />
        </Button>
      </Box>

      <Box textAlign={'center'}>
        <canvas hidden ref={canvasRef} />
      </Box>

      <Box textAlign={'center'}>
        <Text fontSize={'3xl'}><b>Merged Image:</b></Text>
        <Image marginLeft={'auto'} marginRight={'auto'} display={'block'} src={mergedURL} />
        <Text><b>Merged Image Dimensions (W x H):</b> {mergedDimensions}</Text>
      </Box>
      {/* {merged ?
        :
        <Box>

        </Box>
      } */}
    </Box>
  )
}