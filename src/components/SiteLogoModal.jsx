import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Link2,
  X,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layout,
  Upload,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';

export const SiteLogoModal = ({
  isOpen,
  onClose,
  siteLogos,
  onSaveSiteLogos,
}) => {
  const [headerLogoInput, setHeaderLogoInput] = useState(siteLogos?.headerLogo || '/logo.png');
  const [footerLogoInput, setFooterLogoInput] = useState(siteLogos?.footerLogo || '/logo.png');
  const [activeTarget, setActiveTarget] = useState('both'); // 'header', 'footer', 'both'
  const [savedNotice, setSavedNotice] = useState('');
  const [uploading, setUploading] = useState(false);

  const headerFileInputRef = useRef(null);
  const footerFileInputRef = useRef(null);
  const generalFileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process image file upload from computer and convert to optimized base64 Data URL
  const processFileUpload = (file, callback) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl) {
        setUploading(false);
        return;
      }

      // If SVG or small file, use direct data URL
      if (file.type.includes('svg') || file.size < 300 * 1024) {
        callback(dataUrl);
        setUploading(false);
        return;
      }

      // Optimize canvas image for larger files
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedUrl = canvas.toDataURL('image/png', 0.92);
        callback(compressedUrl);
        setUploading(false);
      };
      img.onerror = () => {
        callback(dataUrl);
        setUploading(false);
      };
      img.src = dataUrl;
    };

    reader.onerror = () => {
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFileUpload(file, (dataUrl) => {
      if (target === 'header') {
        setHeaderLogoInput(dataUrl);
      } else if (target === 'footer') {
        setFooterLogoInput(dataUrl);
      } else {
        setHeaderLogoInput(dataUrl);
        setFooterLogoInput(dataUrl);
      }
    });

    // Reset file input
    e.target.value = '';
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSiteLogos({
      headerLogo: headerLogoInput.trim() || '/logo.png',
      footerLogo: footerLogoInput.trim() || '/logo.png',
    });
    setSavedNotice('Site profile pictures & logos updated successfully!');
    setTimeout(() => {
      setSavedNotice('');
      onClose();
    }, 1200);
  };

  const handleResetToDefault = (target) => {
    if (target === 'header') setHeaderLogoInput('/logo.png');
    else if (target === 'footer') setFooterLogoInput('/logo.png');
    else {
      setHeaderLogoInput('/logo.png');
      setFooterLogoInput('/logo.png');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-purple-900/60 shadow-2xl shadow-purple-950/80 overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Top Bar Header */}
        <div className="p-5 border-b border-purple-900/40 bg-slate-950/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>Customize Main Site Logos</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                  Header & Footer
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload image files from your computer or paste custom image URLs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {savedNotice && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2.5 px-4 text-center flex items-center justify-center space-x-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Quick Apply Upload Dropzone */}
          <div className="p-5 rounded-2xl bg-purple-950/30 border-2 border-dashed border-purple-500/40 hover:border-purple-400/80 transition-all text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-black text-white">Upload New Logo from Computer</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Select an image from your device to apply to the top-left Header logo, Footer logo, or both!
              </p>
            </div>

            <input
              type="file"
              ref={generalFileInputRef}
              onChange={(e) => handleFileChange(e, activeTarget)}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTarget('both');
                  generalFileInputRef.current?.click();
                }}
                disabled={uploading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload for Both (Header & Footer)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTarget('header');
                  generalFileInputRef.current?.click();
                }}
                disabled={uploading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center space-x-1.5 border border-purple-900/50 transition-colors"
              >
                <span>Upload Header Only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTarget('footer');
                  generalFileInputRef.current?.click();
                }}
                disabled={uploading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center space-x-1.5 border border-purple-900/50 transition-colors"
              >
                <span>Upload Footer Only</span>
              </button>
            </div>
          </div>

          {/* Detailed Image Source Settings & Live Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Header Logo (Top-Left Corner) */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-900/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    Top-Left Header Logo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetToDefault('header')}
                  className="text-[10px] font-bold text-slate-400 hover:text-purple-300 flex items-center space-x-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Preview Frame */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-purple-500/50 shadow-md bg-black shrink-0 flex items-center justify-center">
                  <img
                    src={headerLogoInput || '/logo.png'}
                    alt="Header Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo.png';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">LAZRHUB Header</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Appears in top left navigation bar</span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                  <Link2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Image URL Link:</span>
                </label>
                <input
                  type="text"
                  value={headerLogoInput}
                  onChange={(e) => setHeaderLogoInput(e.target.value)}
                  placeholder="https://example.com/my-header-logo.png"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* File Chooser Button */}
              <div>
                <input
                  type="file"
                  ref={headerFileInputRef}
                  onChange={(e) => handleFileChange(e, 'header')}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => headerFileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose File from Computer</span>
                </button>
              </div>
            </div>

            {/* 2. Footer Logo */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-900/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    Footer Brand Logo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetToDefault('footer')}
                  className="text-[10px] font-bold text-slate-400 hover:text-purple-300 flex items-center space-x-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Preview Frame */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-purple-500/50 shadow-md bg-black shrink-0 flex items-center justify-center">
                  <img
                    src={footerLogoInput || '/logo.png'}
                    alt="Footer Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo.png';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">LAZRHUB Footer</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Appears at bottom of every page</span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                  <Link2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Image URL Link:</span>
                </label>
                <input
                  type="text"
                  value={footerLogoInput}
                  onChange={(e) => setFooterLogoInput(e.target.value)}
                  placeholder="https://example.com/my-footer-logo.png"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* File Chooser Button */}
              <div>
                <input
                  type="file"
                  ref={footerFileInputRef}
                  onChange={(e) => handleFileChange(e, 'footer')}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => footerFileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose File from Computer</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Bar Actions */}
        <div className="p-4 sm:p-5 border-t border-purple-900/40 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleResetToDefault('both')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset All to Default</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all border border-purple-400/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Site Logos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
