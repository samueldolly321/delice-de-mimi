import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, Check, FolderOpen } from 'lucide-react';

const MAX_INPUT_BYTES = 15 * 1024 * 1024; // fichier choisi par l'utilisateur
const MAX_OUTPUT_CHARS = 1.5 * 1024 * 1024; // data URL enregistrée
const MAX_DIMENSION = 1600; // px, côté le plus long (suffit pour le diaporama plein écran)

/**
 * Redimensionne (côté le plus long ≤ MAX_DIMENSION) et recompresse une image.
 * JPEG pour les photos ; WebP si l'image a de la transparence (logo détouré…).
 */
function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 250) { transparent = true; break; }
      }

      let out: string;
      if (transparent) {
        // WebP garde la transparence (un navigateur sans WebP renvoie du PNG).
        out = canvas.toDataURL('image/webp', 0.85);
      } else {
        // Fond blanc sous l'image avant l'export JPEG.
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        out = canvas.toDataURL('image/jpeg', 0.82);
      }
      // Ne jamais rendre une image plus lourde que l'originale.
      resolve(out.length < dataUrl.length ? out : dataUrl);
    };
    img.onerror = () => reject(new Error('image illisible'));
    img.src = dataUrl;
  });
}

interface ImageUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  className?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'Image',
  placeholder = 'https://...',
  helperText = 'Importez un fichier image depuis votre ordinateur ou collez une URL',
  aspectRatio = 'auto',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, SVG).');
      return;
    }

    // Les photos (souvent prises au téléphone) sont redimensionnées et
    // recompressées avant d'être enregistrées : l'image est stockée en base64
    // dans la base et renvoyée à chaque visiteur, donc chaque Ko compte.
    if (file.size > MAX_INPUT_BYTES) {
      setErrorMsg("L'image est trop volumineuse (max 15 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      // SVG et GIF (animations) : gardés tels quels.
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        if (dataUrl.length > MAX_OUTPUT_CHARS) {
          setErrorMsg('Ce fichier est trop lourd. Utilisez une image JPG ou PNG.');
          return;
        }
        onChange(dataUrl);
        return;
      }
      try {
        const compressed = await compressImage(dataUrl);
        if (compressed.length > MAX_OUTPUT_CHARS) {
          setErrorMsg("L'image reste trop lourde après compression. Essayez une image plus simple.");
          return;
        }
        onChange(compressed);
      } catch {
        setErrorMsg('Impossible de lire cette image. Essayez un fichier JPG ou PNG.');
      }
    };
    reader.onerror = () => {
      setErrorMsg("Erreur lors de la lecture de l'image.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-700 block">
          {label}
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-[#C62828] text-white font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Fichier local
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              mode === 'url'
                ? 'bg-[#C62828] text-white font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Lien URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#C62828] bg-red-50/50'
              : 'border-stone-300 hover:border-[#C62828] hover:bg-stone-50/80 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>

            <div className="text-left">
              <p className="text-xs font-semibold text-stone-800">
                <span className="text-[#C62828] underline underline-offset-2">Cliquez pour importer depuis votre ordinateur</span> ou glissez-déposez
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                PNG, JPG, WebP ou SVG — compressée automatiquement
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#C62828]"
          />
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-red-600">{errorMsg}</p>
      )}

      {/* Image Preview */}
      {value && (
        <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
          <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-stone-300 bg-stone-200 shrink-0">
            <img
              src={value}
              alt="Aperçu"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80';
              }}
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Image prête</span>
            </p>
            <p className="text-[10px] text-stone-500 truncate">
              {value.startsWith('data:') ? 'Image importée depuis votre PC' : value}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-200 transition-colors"
            title="Supprimer l'image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {helperText && !value && (
        <p className="text-[10px] text-stone-500">{helperText}</p>
      )}
    </div>
  );
};
