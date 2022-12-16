type Resize = {
  image: ImageData,
  newWidth: number,
  Iteration?: (args: IterationArgs) => Promise<void>,
};

export type Coordinate = { x: number, y: number };
export type Size = { w: number, h: number };
export type Seam = Coordinate[];
export type EnergyMap = number[][];

export type Color = [r: number, g: number, b: number, a: number] | Uint8ClampedArray;

export const ALPHA_DELETE_THRESHOLD = 244;

export const MAX_WIDTH_LIMIT = 1500;
export const MAX_HEIGHT_LIMIT = 1500;

type SeamMeta = {
  energy: number,
  coordinate: Coordinate,
  previous: Coordinate | null,
};

export const getPixel = (img: ImageData, { x, y }: Coordinate): Color => {
  const i = y * img.width + x;
  return img.data.subarray(i * 4, i * 4 + 4);
};

export const setPixel = (img: ImageData, { x, y }: Coordinate, color: Color) => {
  const i = y * img.width + x;
  img.data.set(color, i * 4);
};

const getPixelDeleteEnergy = (): number => {
  const numColors = 3;
  const maxColorDistance = 255;
  const numNeighbors = 2;
  const multiplier = 2;
  const maxSeamSize = Math.max(MAX_WIDTH_LIMIT, MAX_HEIGHT_LIMIT);
  return -1 * multiplier * numNeighbors * maxSeamSize * numColors * (maxColorDistance ** 2);
};

export const matrix = <T>(w: number, h: number, filler: T): T[][] => {
  return new Array(h)
    .fill(null)
    .map(() => {
      return new Array(w).fill(filler);
    });
};

export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getPixelEnergy = (left: Color | null, middle: Color, right: Color | null): number => {
  const [mR, mG, mB, mA] = middle;

  let lEnergy = 0;
  if (left) {
    const [lR, lG, lB] = left;
    lEnergy = (lR - mR) ** 2 + (lG - mG) ** 2 + (lB - mB) ** 2;
  }

  let rEnergy = 0;
  if (right) {
    const [rR, rG, rB] = right;
    rEnergy = (rR - mR) ** 2 + (rG - mG) ** 2 + (rB - mB) ** 2;
  }

  return mA > ALPHA_DELETE_THRESHOLD ? (lEnergy + rEnergy) : getPixelDeleteEnergy();
};

export type IterationArgs = {
  seam: Seam,
  image: ImageData,
  size: Size,
  energyMap: EnergyMap,
  current: number,
  end: number,
};

type ResizeArgs = {
  image: ImageData,
  numPixels: number,
  size: Size,
  Iteration?: (args: IterationArgs) => Promise<void>,
};

const pixelEnergy = (img: ImageData, { h }: Size, { x, y }: Coordinate): number => {
  const top = (y - 1) >= 0 ? getPixel(img, { x, y: y - 1 }) : null;
  const middle = getPixel(img, { x, y });
  const bottom = (y + 1) < h ? getPixel(img, { x, y: y + 1 }) : null;
  return getPixelEnergy(top, middle, bottom);
};

const reCalcEnergy = (
  image: ImageData, 
  size: Size,
  energy: EnergyMap,
  seam: Seam
): EnergyMap => {
  seam.forEach(({ x: i, y: j }: Coordinate) => {
    // Deleting the seam from the energy map.
    for (let x = i; x < (size.w - 1); ++x) {
      energy[j][x] = energy[j][x + 1];
    }
    // Recalculating the energy pixels around the deleted seam.
    energy[j][i] = pixelEnergy(image, size, { x: i, y: j });
  });
  return energy;
}

const calcEnergy = (img: ImageData, { w, h }: Size): EnergyMap => {
  const energyMap: number[][] = matrix<number>(w, h, Infinity);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      energyMap[y][x] = pixelEnergy(img, { w, h }, { x, y });
    }
  }
  return energyMap;
};

export const findSeam = (energyMap: EnergyMap, { w, h }: Size): Seam => {
  const seamsMap: (SeamMeta | null)[][] = matrix<SeamMeta | null>(w, h, null);

  // Populate the first row of the map.
  for (let x = 0; x < w; x += 1) {
    const y = 0;
    seamsMap[y][x] = {
      energy: energyMap[y][x],
      coordinate: { x, y },
      previous: null,
    };
  }

  // Populate the rest of the rows.
  for (let y = 1; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      // Find top adjacent cell with minimum energy.
      let minPrevEnergy = Infinity;
      let minPrevX: number = x;
      for (let i = (x - 1); i <= (x + 1); i += 1) {
        // @ts-ignore
        if (i >= 0 && i < w && seamsMap[y - 1][i].energy < minPrevEnergy) {
          // @ts-ignore
          minPrevEnergy = seamsMap[y - 1][i].energy;
          minPrevX = i;
        }
      }

      // Update the current cell.
      seamsMap[y][x] = {
        energy: minPrevEnergy + energyMap[y][x],
        coordinate: { x, y },
        previous: { x: minPrevX, y: y - 1 },
      };
    }
  }

  // Find where the minimum energy seam ends.
  let lastMinCoordinate: Coordinate | null = null;
  let minSeamEnergy = Infinity;
  for (let x = 0; x < w; x += 1) {
    const y = h - 1;
    // @ts-ignore
    if (seamsMap[y][x].energy < minSeamEnergy) {
      // @ts-ignore
      minSeamEnergy = seamsMap[y][x].energy;
      lastMinCoordinate = { x, y };
    }
  }

  // Find the minimal energy seam.
  const seam: Seam = [];
  if (!lastMinCoordinate) {
    return seam;
  }

  const { x: lastMinX, y: lastMinY } = lastMinCoordinate;

  let currentSeam = seamsMap[lastMinY][lastMinX];
  while (currentSeam) {
    seam.push(currentSeam.coordinate);
    const prevMinCoordinates = currentSeam.previous;
    if (!prevMinCoordinates) {
      currentSeam = null;
    } else {
      const { x: prevMinX, y: prevMinY } = prevMinCoordinates;
      currentSeam = seamsMap[prevMinY][prevMinX];
    }
  }

  return seam;
};

const deleteSeam = (img: ImageData, seam: Seam, { w }: Size): void => {
  seam.forEach(({ x: seamX, y: seamY }: Coordinate) => {
    for (let x = seamX; x < (w - 1); x += 1) {
      const nextPixel = getPixel(img, { x: x + 1, y: seamY });
      setPixel(img, { x, y: seamY }, nextPixel);
    }
  });
};

const resizeWidth = async (args: ResizeArgs) => {
  const { image, numPixels, Iteration, size} = args

  let energy: EnergyMap | null = null
  let seam: Seam | null = null

  for (let i = 0; i < numPixels; ++i) {
    if (energy && seam) {
      energy = reCalcEnergy(image, size, energy, seam)
    }
    else {
      energy = calcEnergy(image, size)
    }

    seam = findSeam(energy, size);
    deleteSeam(image, seam, size);

    if(Iteration) {
      await Iteration({
        energyMap: energy,
        seam,
        image,
        size,
        current: i,
        end: numPixels
      })
    }

    size.w -= 1

    await wait(1)
  }
}

export const renderImage = async (args: Resize) =>{
  const {
    image,
    newWidth,
    Iteration
  } = args

  const numPixels = image.width - newWidth;
  const size: Size = {w: image.width, h: image.height}
  
  let curr = 0

  const Iterating = async (iArgs: IterationArgs) => {
    const {
      seam,
      image: currImage,
      size: currSize,
      energyMap,
    } = iArgs

    curr += 1

    if (Iteration) {
      await Iteration({
        seam,
        image: currImage,
        size: currSize,
        energyMap,
        current: curr,
        end: numPixels
      });
    }
  }

  await resizeWidth({
    image,
    numPixels,
    Iteration: Iterating,
    size
  })
};