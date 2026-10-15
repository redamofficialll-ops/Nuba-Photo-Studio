import React, { useState, useEffect } from 'react';
import { GoogleDriveLogo, GoogleSheetsLogo } from './GoogleDriveLogo';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface NubaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  withDriveBadge?: boolean;
  allowEdit?: boolean;
  className?: string;
}

/**
 * Robust Google Drive URL converter:
 * Handles all Google Drive URL formats, extracts File ID, and converts to
 * the reliable Google CDN URL (https://lh3.googleusercontent.com/d/{id})
 * with fallback to drive.google.com/thumbnail.
 */
export function convertGoogleDriveUrl(rawUrl: string): {
  primary: string;
  fallback: string;
  isDrive: boolean;
  fileId: string | null;
} {
  if (!rawUrl) return { primary: '', fallback: '', isDrive: false, fileId: null };
  const trimmed = rawUrl.trim();

  // If it's a data URL, return directly
  if (trimmed.startsWith('data:image/')) {
    return { primary: trimmed, fallback: '', isDrive: false, fileId: null };
  }

  // Extract Google Drive ID from various formats
  let fileId: string | null = null;
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const ucMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else if (idQueryMatch && idQueryMatch[1]) {
    fileId = idQueryMatch[1];
  } else if (ucMatch && ucMatch[1]) {
    fileId = ucMatch[1];
  } else if (lh3Match && lh3Match[1]) {
    fileId = lh3Match[1];
  } else if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    // Direct raw ID string
    fileId = trimmed;
  }

  if (fileId) {
    return {
      primary: `https://lh3.googleusercontent.com/d/${fileId}`,
      fallback: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      isDrive: true,
      fileId,
    };
  }

  // Dropbox fix
  if (trimmed.includes('dropbox.com')) {
    const fixed = trimmed.replace('dl=0', 'raw=1');
    return { primary: fixed, fallback: '', isDrive: false, fileId: null };
  }

  return { primary: trimmed, fallback: '', isDrive: false, fileId: null };
}

export const NubaLogo: React.FC<NubaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  withDriveBadge = false,
  allowEdit = false,
  className = '',
}) => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // Load custom logo from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nuba_custom_logo_v1');
      if (saved) {
        setLogoUrl(saved);
        setInputUrl(saved);
        const { primary } = convertGoogleDriveUrl(saved);
        setImageSrc(primary);
        setImageError(false);
        setTriedFallback(false);
      }
    } catch (e) {
      console.warn('Could not read custom logo from localStorage', e);
    }
  }, []);

  // Update image source when logoUrl changes
  useEffect(() => {
    if (logoUrl) {
      const { primary } = convertGoogleDriveUrl(logoUrl);
      setImageSrc(primary);
      setImageError(false);
      setTriedFallback(false);
    } else {
      setImageSrc('');
      setImageError(false);
    }
  }, [logoUrl]);

  const handleImageError = () => {
    if (!triedFallback && logoUrl) {
      const { fallback } = convertGoogleDriveUrl(logoUrl);
      if (fallback && fallback !== imageSrc) {
        setTriedFallback(true);
        setImageSrc(fallback);
        return;
      }
    }
    // Both attempts failed, show warning but don't erase user's configuration
    setImageError(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setInputUrl('');
        try {
          localStorage.setItem('nuba_custom_logo_v1', result);
        } catch {
          console.warn('Storage quota exceeded, using in-memory');
        }
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsModalOpen(false);
        }, 900);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    const raw = inputUrl.trim();
    const { primary } = convertGoogleDriveUrl(raw);

    setLogoUrl(raw);
    setImageSrc(primary);
    setImageError(false);
    setTriedFallback(false);

    try {
      localStorage.setItem('nuba_custom_logo_v1', raw);
    } catch {
      // Ignore storage error
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsModalOpen(false);
    }, 900);
  };

  const handleResetToDefault = () => {
    setLogoUrl('');
    setInputUrl('');
    setImageSrc('');
    setImageError(false);
    try {
      localStorage.removeItem('nuba_custom_logo_v1');
    } catch {
      // Ignore
    }
    setIsModalOpen(false);
  };

  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  const driveLogoSizes = {
    sm: 15,
    md: 18,
    lg: 22,
    xl: 28,
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none relative group ${className}`}>
      {/* Logo container */}
      <div className={`relative flex items-center ${heightClasses[size]}`}>
        {imageSrc && !imageError ? (
          <div className="relative flex items-center h-full">
            <img
              src={imageSrc}
              alt="NUBA PHOTO STUDIO"
              className="h-full w-auto max-w-[200px] sm:max-w-[280px] object-contain drop-shadow-2xs rounded-sm transition-all"
              onError={handleImageError}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          /* ==========================================================
             OFFICIAL HIGH-PRECISION VECTOR LOGO (NUBA PHOTO STUDIO)
             Features iconic camera shutter aperture in #008751 & #F99E1C
             plus clean, perfectly aligned typography & subtitle
             ========================================================== */
          <div className="flex items-center h-full">
            <svg
              viewBox="0 0 310 70"
              className="h-full w-auto max-w-[280px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Nuba Photo Studio Logo"
            >
              <defs>
                {/* Emerald Gradient */}
                <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0D9E64" />
                  <stop offset="100%" stopColor="#007545" />
                </linearGradient>

                {/* Golden Orange Gradient */}
                <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>

                {/* Subtle Lens Shadow */}
                <radialGradient id="lensReflect" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* === 1. EMBLEM: Camera Shutter Aperture Icon (x: 4 to 58, y: 8 to 62) === */}
              <g transform="translate(4, 8)">
                {/* Outer Ring */}
                <circle cx="27" cy="27" r="26" stroke="#008751" strokeWidth="2.5" fill="#F8FAFC" />

                {/* Aperture Blade 1 (Green) */}
                <path
                  d="M27 4 C36 4, 46 12, 48 22 L33 27 Z"
                  fill="url(#emeraldGrad)"
                />
                {/* Aperture Blade 2 (Orange) */}
                <path
                  d="M48 22 C50 32, 46 42, 38 48 L27 34 Z"
                  fill="url(#amberGrad)"
                />
                {/* Aperture Blade 3 (Green) */}
                <path
                  d="M38 48 C28 53, 17 50, 10 42 L22 29 Z"
                  fill="url(#emeraldGrad)"
                />
                {/* Aperture Blade 4 (Orange) */}
                <path
                  d="M10 42 C4 34, 4 22, 10 13 L24 24 Z"
                  fill="url(#amberGrad)"
                />
                {/* Aperture Blade 5 (Green) */}
                <path
                  d="M10 13 C15 6, 25 3, 33 6 L27 22 Z"
                  fill="url(#emeraldGrad)"
                />

                {/* Inner Optical Lens Core */}
                <circle cx="27" cy="27" r="9" fill="#063F29" />
                <circle cx="27" cy="27" r="9" fill="url(#lensReflect)" />
                <circle cx="25" cy="25" r="3" fill="#ffffff" fillOpacity="0.8" />
              </g>

              {/* === 2. WORDMARK: "nuba" Typography (x: 72, y: 40) === */}
              {/* Letter 'n' */}
              <text
                x="72"
                y="41"
                fill="#008751"
                style={{
                  fontFamily: 'system-ui, -apple-system, Montserrat, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: '38px',
                  letterSpacing: '-0.02em',
                }}
              >
                n
              </text>

              {/* Letter 'u' (Vibrant Golden Orange) */}
              <text
                x="98"
                y="41"
                fill="#F99E1C"
                style={{
                  fontFamily: 'system-ui, -apple-system, Montserrat, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: '38px',
                  letterSpacing: '-0.02em',
                }}
              >
                u
              </text>

              {/* Letters 'ba' */}
              <text
                x="125"
                y="41"
                fill="#008751"
                style={{
                  fontFamily: 'system-ui, -apple-system, Montserrat, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: '38px',
                  letterSpacing: '-0.02em',
                }}
              >
                ba
              </text>

              {/* === 3. SUBTITLE: "PHOTO STUDIO" (x: 73, y: 58) === */}
              {showSubtitle && (
                <g>
                  {/* Decorative divider line under nuba */}
                  <line x1="73" y1="46" x2="295" y2="46" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="73" y1="46" x2="140" y2="46" stroke="#F99E1C" strokeWidth="2" strokeLinecap="round" />

                  <text
                    x="73"
                    y="59"
                    fill="#1E293B"
                    style={{
                      fontFamily: 'system-ui, -apple-system, Montserrat, Arial, sans-serif',
                      fontWeight: 800,
                      fontSize: '11px',
                      letterSpacing: '0.42em',
                    }}
                  >
                    PHOTO STUDIO
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}

        {/* Quick Edit / Upload Trigger Button */}
        {allowEdit && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Pengaturan Logo & Google Drive"
            className="absolute -right-2 -bottom-1 p-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#008751] rounded-full shadow-md border border-slate-200 transition-transform transform scale-90 hover:scale-105 cursor-pointer z-10"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Google Drive & Google Sheets Badge Side-by-Side */}
      {withDriveBadge && (
        <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:bg-white transition-colors">
            <GoogleDriveLogo size={driveLogoSizes[size]} />
            <div className="h-3.5 w-[1px] bg-slate-300" />
            <GoogleSheetsLogo size={driveLogoSizes[size]} />
            <div className="flex flex-col text-left leading-tight pl-0.5">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-800 tracking-tight flex items-center gap-1">
                <span>Google Drive</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[8px] sm:text-[9px] text-[#008751] font-bold">Real-Time Sync</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logo Upload & Google Drive Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#063F29] to-[#0D8A5B] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Camera className="w-5 h-5 text-[#F99E1C]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">Pengaturan Logo Studio</h3>
                  <p className="text-[11px] text-emerald-100">Gunakan Logo Resmi atau Sambungkan File Google Drive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              {/* Current Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pratinjau Logo Saat Ini
                </span>
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center min-h-[60px] w-full max-w-xs">
                  {imageSrc && !imageError ? (
                    <img
                      src={imageSrc}
                      alt="Pratinjau Logo"
                      className="max-h-12 w-auto object-contain"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <NubaLogo size="md" allowEdit={false} withDriveBadge={false} />
                    </div>
                  )}
                </div>
                {imageError && (
                  <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-left w-full flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Link gambar tidak dapat diakses.</p>
                      <p className="mt-0.5 text-slate-600">
                        Jika menggunakan Google Drive, pastikan izin file disetel ke <b>"Siapa saja yang memiliki link"</b> (Public). Atau pilih file gambar langsung di bawah.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 1: Direct File Upload (100% Reliable & Fast) */}
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 text-center space-y-2 hover:bg-emerald-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <label
                    htmlFor="logo-file-picker"
                    className="font-bold text-sm text-[#008751] hover:underline cursor-pointer block"
                  >
                    Unggah File Logo Langsung (Logo-01.png)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format didukung: PNG, JPG, SVG, WebP. Tersimpan permanen di perangkat tanpa perlu internet.
                  </p>
                </div>
                <input
                  id="logo-file-picker"
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Option 2: Paste Google Drive / Web Image Link */}
              <form onSubmit={handleSaveUrl} className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <GoogleDriveLogo size={16} />
                    <span>Atau Tempel Link File Google Drive:</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-Convert Drive
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/... atau ID file"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#008751]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#008751] hover:bg-[#007042] text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    Terapkan
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">💡 Cara mengambil link Google Drive:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-slate-500">
                    <li>Buka file logo Anda di Google Drive.</li>
                    <li>Klik <b>Bagikan (Share)</b> &gt; Ubah Akses Umum menjadi <b>"Siapa saja yang memiliki link"</b>.</li>
                    <li>Klik <b>Salin link (Copy link)</b> lalu tempelkan di kotak atas. Sistem akan mengubahnya menjadi direct image otomatis!</li>
                  </ol>
                </div>
              </form>

              {/* Success Notification */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Logo berhasil disimpan dan diterapkan!</span>
                </div>
              )}

              {/* Reset to Official Vector Logo */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Status: {logoUrl ? 'Menggunakan Logo Kustom' : 'Menggunakan Logo Vektor Resmi Nuba'}
                </span>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Kembalikan ke Logo Bawaan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
