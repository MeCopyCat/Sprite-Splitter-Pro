export interface ProcessedAsset {
  id: string;
  url: string;
  blob: Blob;
  width: number;
  height: number;
  originalX: number;
  originalY: number;
  fileName: string;
}

export interface ProcessingOptions {
  threshold: number; // 0-255, what counts as "white" background
  padding: number; // pixels around the crop
  minArea: number; // minimum pixel area to be considered an asset (noise reduction)
  gapFill: number; // dilation radius to merge disconnected parts
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}