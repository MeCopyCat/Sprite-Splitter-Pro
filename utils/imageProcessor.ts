import { ProcessedAsset, ProcessingOptions } from '../types';

/**
 * Optimized stack-based flood fill to prevent stack overflow on large images.
 */
class FloodFill {
  width: number;
  height: number;
  stack: Int32Array;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Pre-allocate stack to max possible size to avoid GC and resizing
    this.stack = new Int32Array(width * height);
  }

  fill(
    startX: number, 
    startY: number, 
    targetMap: Int32Array | Uint8Array, 
    targetValue: number, 
    fillValue: number,
    conditionFn?: (idx: number) => boolean
  ) {
    let stackPtr = 0;
    const startIdx = startY * this.width + startX;
    
    if (targetMap[startIdx] !== targetValue) return;
    if (conditionFn && !conditionFn(startIdx)) return;

    this.stack[stackPtr++] = startIdx;
    targetMap[startIdx] = fillValue;

    while (stackPtr > 0) {
      const currIdx = this.stack[--stackPtr];
      const cx = currIdx % this.width;
      const cy = Math.floor(currIdx / this.width);

      // Check 4 neighbors
      // Right
      if (cx + 1 < this.width) {
        const nIdx = currIdx + 1;
        if (targetMap[nIdx] === targetValue && (!conditionFn || conditionFn(nIdx))) {
          targetMap[nIdx] = fillValue;
          this.stack[stackPtr++] = nIdx;
        }
      }
      // Left
      if (cx - 1 >= 0) {
        const nIdx = currIdx - 1;
        if (targetMap[nIdx] === targetValue && (!conditionFn || conditionFn(nIdx))) {
          targetMap[nIdx] = fillValue;
          this.stack[stackPtr++] = nIdx;
        }
      }
      // Down
      if (cy + 1 < this.height) {
        const nIdx = currIdx + this.width;
        if (targetMap[nIdx] === targetValue && (!conditionFn || conditionFn(nIdx))) {
          targetMap[nIdx] = fillValue;
          this.stack[stackPtr++] = nIdx;
        }
      }
      // Up
      if (cy - 1 >= 0) {
        const nIdx = currIdx - this.width;
        if (targetMap[nIdx] === targetValue && (!conditionFn || conditionFn(nIdx))) {
          targetMap[nIdx] = fillValue;
          this.stack[stackPtr++] = nIdx;
        }
      }
    }
  }
}

/**
 * Efficient Box Dilation using sliding window optimization (O(N)).
 * Dilates '1's into '0's.
 */
const boxDilate = (input: Uint8Array, width: number, height: number, radius: number): Uint8Array => {
  if (radius <= 0) return new Uint8Array(input); // Copy
  
  const len = width * height;
  const temp = new Uint8Array(len);
  const output = new Uint8Array(len);
  
  // Horizontal Pass
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const rowOffset = y * width;
    
    // Initialize window for x=0
    for (let i = 0; i <= radius && i < width; i++) {
        if (input[rowOffset + i] !== 0) sum++;
    }
    
    for (let x = 0; x < width; x++) {
        temp[rowOffset + x] = sum > 0 ? 1 : 0;
        
        // Slide window right
        const trailing = x - radius;
        if (trailing >= 0) {
            if (input[rowOffset + trailing] !== 0) sum--;
        }
        
        const leading = x + radius + 1;
        if (leading < width) {
            if (input[rowOffset + leading] !== 0) sum++;
        }
    }
  }

  // Vertical Pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    
    // Initialize window for y=0
    for (let i = 0; i <= radius && i < height; i++) {
        if (temp[i * width + x] !== 0) sum++;
    }
    
    for (let y = 0; y < height; y++) {
        output[y * width + x] = sum > 0 ? 1 : 0;
        
        // Slide window down
        const trailing = y - radius;
        if (trailing >= 0) {
            if (temp[trailing * width + x] !== 0) sum--;
        }
        
        const leading = y + radius + 1;
        if (leading < height) {
            if (temp[leading * width + x] !== 0) sum++;
        }
    }
  }
  
  return output;
};


export const processSpriteSheetRobust = async (
  file: File,
  options: ProcessingOptions
): Promise<ProcessedAsset[]> => {
  // 1. Load Image
  const imgBitmap = await createImageBitmap(file);
  const width = imgBitmap.width;
  const height = imgBitmap.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context unavailable");
  
  ctx.drawImage(imgBitmap, 0, 0);
  const sourceData = ctx.getImageData(0, 0, width, height);
  const data = sourceData.data;

  // 2. Preprocessing: Binary Threshold
  const len = width * height;
  const binaryMap = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const avg = (r + g + b) / 3;
    // Inverse Threshold: Structure = 1, Background = 0
    binaryMap[i] = avg < options.threshold ? 1 : 0;
  }

  // 3. Light Dilation (3x3) - "Closing" hairline gaps
  const lightDilatedMap = new Uint8Array(len);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binaryMap[idx] === 1) {
        lightDilatedMap[idx] = 1;
        if (x + 1 < width) lightDilatedMap[idx + 1] = 1;
        if (x - 1 >= 0) lightDilatedMap[idx - 1] = 1;
        if (y + 1 < height) lightDilatedMap[idx + width] = 1;
        if (y - 1 >= 0) lightDilatedMap[idx - width] = 1;
        if (x + 1 < width && y + 1 < height) lightDilatedMap[idx + width + 1] = 1;
        if (x - 1 >= 0 && y + 1 < height) lightDilatedMap[idx + width - 1] = 1;
        if (x + 1 < width && y - 1 >= 0) lightDilatedMap[idx - width + 1] = 1;
        if (x - 1 >= 0 && y - 1 >= 0) lightDilatedMap[idx - width - 1] = 1;
      }
    }
  }

  // 4. Solid Mask Generation (Fill Internal Holes)
  // Flood fill background '0's. Result: 1=Background, 0=Object
  const bgLabelMap = new Int32Array(len); // 0 init
  const filler = new FloodFill(width, height);

  // Seed flood fill from edges
  const isBackground = (idx: number) => lightDilatedMap[idx] === 0;
  for (let x = 0; x < width; x++) {
    filler.fill(x, 0, bgLabelMap, 0, 1, isBackground);
    filler.fill(x, height - 1, bgLabelMap, 0, 1, isBackground);
  }
  for (let y = 0; y < height; y++) {
    filler.fill(0, y, bgLabelMap, 0, 1, isBackground);
    filler.fill(width - 1, y, bgLabelMap, 0, 1, isBackground);
  }

  // Convert to specific "Solid Object Mask" where 1=Object, 0=Background
  // This mask is "True" to the drawing (no heavy dilation), preserving spaces between parts if they are wide enough.
  const solidObjectMask = new Uint8Array(len);
  for(let i=0; i<len; i++) {
    // If bgLabelMap is 0, it wasn't reached by background fill -> It's Object (or internal hole).
    solidObjectMask[i] = bgLabelMap[i] === 0 ? 1 : 0;
  }

  // 5. Heavy Dilation (Detection Map)
  // We dilate the solid object mask to merge nearby disconnected parts (Head + Steam).
  // Use a box blur/dilation.
  const detectionMap = boxDilate(solidObjectMask, width, height, options.gapFill);

  // 6. Labeling (Find Merged Assets)
  // Now we find connected components on the detectionMap.
  const assetLabelMap = new Int32Array(len);
  let currentLabel = 1;
  const regions: Map<number, { minX: number, maxX: number, minY: number, maxY: number }> = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (detectionMap[idx] === 1 && assetLabelMap[idx] === 0) {
        // Found new component
        const q = [idx];
        assetLabelMap[idx] = currentLabel;
        let minX = x, maxX = x, minY = y, maxY = y;
        let solidPixelCount = 0; // Count actual pixels, not dilated ones

        // BFS/DFS
        while (q.length > 0) {
          const curr = q.pop()!;
          const cx = curr % width;
          const cy = Math.floor(curr / width);

          // IMPORTANT: Check if this pixel is part of the ACTUAL object (non-dilated)
          if (solidObjectMask[curr] === 1) {
            solidPixelCount++;
          }

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // Check 4 neighbors on detectionMap
          const nbs = [curr + 1, curr - 1, curr + width, curr - width];
          if (cx + 1 < width && detectionMap[curr + 1] === 1 && assetLabelMap[curr + 1] === 0) {
             assetLabelMap[curr + 1] = currentLabel; q.push(curr + 1);
          }
          if (cx - 1 >= 0 && detectionMap[curr - 1] === 1 && assetLabelMap[curr - 1] === 0) {
             assetLabelMap[curr - 1] = currentLabel; q.push(curr - 1);
          }
          if (cy + 1 < height && detectionMap[curr + width] === 1 && assetLabelMap[curr + width] === 0) {
             assetLabelMap[curr + width] = currentLabel; q.push(curr + width);
          }
          if (cy - 1 >= 0 && detectionMap[curr - width] === 1 && assetLabelMap[curr - width] === 0) {
             assetLabelMap[curr - width] = currentLabel; q.push(curr - width);
          }
        }

        // CRITICAL FIX: Use solidPixelCount (true area) instead of bounding box or dilated area
        // This ensures a 1px noise speck (dilated to 400px) is still counted as 1px and rejected.
        if (solidPixelCount > options.minArea) {
          regions.set(currentLabel, { minX, maxX, minY, maxY });
          currentLabel++;
        } else {
            // Noise
            currentLabel++;
        }
      }
    }
  }

  // 7. Extraction
  const processedAssets: ProcessedAsset[] = [];
  const pad = options.padding;

  for (const [label, bounds] of regions) {
    const w = bounds.maxX - bounds.minX + 1 + (pad * 2);
    const h = bounds.maxY - bounds.minY + 1 + (pad * 2);
    
    if (w <= 0 || h <= 0) continue;

    const assetCanvas = document.createElement('canvas');
    assetCanvas.width = w;
    assetCanvas.height = h;
    const assetCtx = assetCanvas.getContext('2d');
    if (!assetCtx) continue;

    const assetData = assetCtx.createImageData(w, h);
    
    // Copy data based on solidObjectMask (Original Sharp Mask)
    // But crop based on bounds (Merged Bounds)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const srcX = x - pad + bounds.minX;
            const srcY = y - pad + bounds.minY;
            const targetIdx = (y * w + x) * 4;

            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                const srcIdx = (srcY * width + srcX) * 4;
                const maskIdx = srcY * width + srcX;

                // Use the Solid Object Mask for opacity
                // If it is 1, it's part of the object (or internal hole).
                // If it is 0, it is background.
                if (solidObjectMask[maskIdx] === 1) {
                    assetData.data[targetIdx] = data[srcIdx];
                    assetData.data[targetIdx+1] = data[srcIdx+1];
                    assetData.data[targetIdx+2] = data[srcIdx+2];
                    assetData.data[targetIdx+3] = 255;
                } else {
                    assetData.data[targetIdx+3] = 0;
                }
            }
        }
    }

    assetCtx.putImageData(assetData, 0, 0);

    const blob = await new Promise<Blob | null>(resolve => assetCanvas.toBlob(resolve, 'image/png'));
    if (blob) {
        processedAssets.push({
            id: `asset-${label}`,
            url: URL.createObjectURL(blob),
            blob,
            width: w,
            height: h,
            originalX: bounds.minX - pad,
            originalY: bounds.minY - pad,
            fileName: `asset_${processedAssets.length + 1}.png`
        });
    }
  }

  return processedAssets;
};