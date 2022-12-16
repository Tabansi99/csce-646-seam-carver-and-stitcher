import * as React from "react"
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
  ButtonGroup,
  Button,
} from "@chakra-ui/react"
import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { Logo } from "./Logo"
import { SeamCarver } from "./SeamCarver"
import { SeamStitch } from "./SeamStitcher"

export const App = () => {
  const [carve, setCarve] = React.useState("#660000")
  const [stitch, setStitch] = React.useState("red.700")
  const [iscarve, setIsCarve] = React.useState(true)

  return (
  <ChakraProvider theme={theme}>
    <Box textAlign="center" fontSize="xl">
      <Text color={"#660000"} fontSize="4xl" textAlign={'center'}>
        <b>CSCE 646 Final Project - Seam Carver and Seam Stitcher</b>
      </Text>
      <Text>
        <b>Reuben Chidubem Tabansi</b>
      </Text>
    </Box>

    <Box m='4' textAlign={'center'}>
      <ButtonGroup isAttached>
        <Button
          borderRadius="2xl"
          background={carve}
          color='white'
          _hover={{background: "#660000"}}
          onClick={() => {
            setCarve("#660000")
            setStitch("red.700")
            setIsCarve(true)
          }}
        >
          Seam Carving
        </Button>
        <Button
          borderRadius="2xl"
          background={stitch}
          color='white'
          _hover={{background: "#660000"}}
          onClick={() => {
            setCarve("red.700")
            setStitch("#660000")
            setIsCarve(false)
          }}
        >
          Seam Stitching
        </Button>
      </ButtonGroup>
    </Box>
    { iscarve ?
      <SeamCarver/> :
      <SeamStitch/>
    }
  </ChakraProvider>
)}
