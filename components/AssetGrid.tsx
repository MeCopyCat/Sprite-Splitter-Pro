import React from 'react';
import { ProcessedAsset } from '../types';
import { Download, Grid3X3, Maximize } from 'lucide-react';

interface AssetGridProps {
  assets: ProcessedAsset[];
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets }) => {
  if (assets.length === 0) return null;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <Grid3X3 className="text-brand-400" size={20} />
          Detected Assets <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full ml-2">{assets.length}</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            className="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-brand-500/50 transition-all hover:shadow-lg hover:shadow-brand-500/10"
          >
            {/* Checkerboard background for transparency visualization */}
            <div className="aspect-square w-full relative p-4 flex items-center justify-center bg-[url('https://res.cloudinary.com/demo/image/upload/v1656689874/transparent_checker.png')] bg-repeat">
              <img 
                src={asset.url} 
                alt={asset.fileName} 
                className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform group-hover:scale-110 duration-300" 
              />
            </div>
            
            <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">
                    {asset.width} x {asset.height}
                </span>
                <a 
                  href={asset.url} 
                  download={asset.fileName}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Download size={14} /> Save
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetGrid;
