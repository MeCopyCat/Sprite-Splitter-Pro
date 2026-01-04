import React, { useState } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { 
  Scissors, 
  Download, 
  RefreshCw, 
  Settings2, 
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import DropZone from './components/DropZone';
import AssetGrid from './components/AssetGrid';
import { processSpriteSheetRobust } from './utils/imageProcessor';
import { ProcessedAsset, ProcessingOptions, AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [assets, setAssets] = useState<ProcessedAsset[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  
  // Processing Options
  const [threshold, setThreshold] = useState<number>(245);
  const [padding, setPadding] = useState<number>(2);
  const [minArea, setMinArea] = useState<number>(50);
  const [gapFill, setGapFill] = useState<number>(10); // Default to 10px dilation radius (~20px gap close)

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file);
    setOriginalImagePreview(URL.createObjectURL(file));
    setAppState(AppState.PROCESSING);
    
    try {
      // Small timeout to allow UI to update to loading state
      setTimeout(async () => {
        const results = await processSpriteSheetRobust(file, {
          threshold,
          padding,
          minArea,
          gapFill
        });
        setAssets(results);
        setAppState(AppState.COMPLETE);
      }, 100);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const handleDownloadZip = async () => {
    if (assets.length === 0) return;
    
    const zip = new JSZip();
    const folder = zip.folder("sprites");
    
    if (folder) {
        assets.forEach((asset) => {
            folder.file(asset.fileName, asset.blob);
        });
        
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "split_sprites.zip");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAssets([]);
    setCurrentFile(null);
    setOriginalImagePreview(null);
  };

  const reProcess = () => {
    if (currentFile) {
        handleFileSelect(currentFile);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-2 rounded-lg">
                <Scissors size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">Sprite Splitter <span className="text-brand-400">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Documentation</a>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">v1.0.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Input */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status Card */}
            {appState === AppState.PROCESSING && (
               <div className="bg-brand-900/20 border border-brand-500/20 rounded-2xl p-6 text-center animate-pulse">
                  <Loader2 className="animate-spin mx-auto text-brand-500 mb-2" size={32} />
                  <p className="text-brand-200 font-medium">Processing Image...</p>
                  <p className="text-sm text-brand-400/60 mt-1">Analyzing pixels and isolating sprites</p>
               </div>
            )}

            {appState === AppState.IDLE && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-xl shadow-black/20">
                 <DropZone onFileSelect={handleFileSelect} />
              </div>
            )}

            {appState === AppState.COMPLETE && currentFile && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-brand-400" />
                        Original Image
                    </h3>
                    <button onClick={handleReset} className="text-xs text-slate-400 hover:text-white underline">
                        Upload New
                    </button>
                 </div>
                 <div className="aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative group">
                    {originalImagePreview && (
                        <img src={originalImagePreview} alt="Original" className="w-full h-full object-contain" />
                    )}
                 </div>
                 <div className="mt-4 flex gap-2">
                     <button 
                        onClick={handleDownloadZip}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/20"
                     >
                        <Download size={18} />
                        Download ZIP
                     </button>
                 </div>
              </div>
            )}

            {/* Configuration Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                    <Settings2 size={18} className="text-slate-400" />
                    <h3 className="font-semibold text-slate-200">Processing Settings</h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">White Threshold</span>
                            <span className="text-brand-400 font-mono">{threshold}</span>
                        </div>
                        <input 
                            type="range" 
                            min="200" 
                            max="255" 
                            value={threshold} 
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Sensitivity to background color (255 is pure white)</p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Gap Closing (Dilation)</span>
                            <span className="text-brand-400 font-mono">{gapFill}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="30" 
                            value={gapFill} 
                            onChange={(e) => setGapFill(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Merge disconnected parts (e.g. floating items)</p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Padding</span>
                            <span className="text-brand-400 font-mono">{padding}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="20" 
                            value={padding} 
                            onChange={(e) => setPadding(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Extra space around cropped assets</p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Min Area (Noise)</span>
                            <span className="text-brand-400 font-mono">{minArea}px</span>
                        </div>
                         <input 
                            type="range" 
                            min="10" 
                            max="500" 
                            value={minArea} 
                            onChange={(e) => setMinArea(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                         <p className="text-xs text-slate-500 mt-1">Ignore objects smaller than this</p>
                    </div>

                    {appState === AppState.COMPLETE && (
                        <button 
                            onClick={reProcess}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Apply Settings & Reprocess
                        </button>
                    )}
                </div>
            </div>

          </div>

          {/* Right Column: Output Grid */}
          <div className="lg:col-span-8">
             {appState === AppState.ERROR && (
                <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-900/50 bg-red-900/10 rounded-3xl text-center">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-red-200">Processing Failed</h3>
                    <p className="text-red-400 mt-2">Could not process the image. Please try a clearer image or adjust settings.</p>
                    <button onClick={handleReset} className="mt-6 px-6 py-2 bg-red-900/50 hover:bg-red-800 text-red-100 rounded-lg transition-colors">
                        Try Again
                    </button>
                </div>
             )}

             {appState === AppState.IDLE && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl text-center bg-slate-900/20">
                    <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                        <ImageIcon size={48} className="text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700">No Assets Yet</h3>
                    <p className="text-slate-500 mt-2 max-w-md">Upload a sprite sheet on the left to instantly detect, crop, and export individual assets.</p>
                </div>
             )}

             {appState === AppState.COMPLETE && (
                 <AssetGrid assets={assets} />
             )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;