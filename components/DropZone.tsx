import React, { useCallback } from 'react';
import { Upload, FileImage } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.target.files && e.target.files[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative group w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
        disabled
          ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed opacity-50'
          : 'border-slate-600 bg-slate-900/50 hover:border-brand-500 hover:bg-slate-800/80 cursor-pointer'
      }`}
    >
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className={`p-4 rounded-full transition-colors ${disabled ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-brand-400 group-hover:bg-brand-500/10 group-hover:text-brand-500 group-hover:scale-110 duration-300'}`}>
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">
            Upload Sprite Sheet
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Drag & drop or click to browse. Supports PNG, JPG, WEBP.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
