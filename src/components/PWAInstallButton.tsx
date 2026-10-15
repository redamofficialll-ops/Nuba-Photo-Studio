import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow (when beforeinstallprompt fired)
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D8A5B] to-[#063F29] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-[#09734a] hover:to-[#042d1e] transition-all cursor-pointer"
        title="Install Aplikasi di Perangkat"
      >
        <Download className="w-4 h-4 text-emerald-300 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow or manual fallback so users on iOS/mobile always have install option
  if (isIOS || /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-[#0D8A5B] shadow-xs hover:bg-emerald-100 transition-all cursor-pointer"
          title="Panduan Install App di HP"
        >
          <Smartphone className="w-4 h-4 text-[#0D8A5B]" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0D8A5B]">
                  <Smartphone className="w-5 h-5" />
                  <h3 className="font-bold text-base text-slate-800">Install ke Layar Utama</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isIOS ? (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>Cara install di iPhone / iPad (Safari):</p>
                  <ol className="list-decimal pl-4 space-y-1 font-medium text-slate-700">
                    <li>Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah Safari.</li>
                    <li>Gulir ke bawah dan ketuk <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).</li>
                    <li>Ketuk <strong>Add</strong> di sudut kanan atas. Selesai!</li>
                  </ol>
                </div>
              ) : (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>Cara install di Android (Chrome / Browser):</p>
                  <ol className="list-decimal pl-4 space-y-1 font-medium text-slate-700">
                    <li>Ketuk menu titik tiga (⋮) di kanan atas browser Anda.</li>
                    <li>Pilih <strong>Install app</strong> atau <strong>Add to Home screen</strong> (Tambahkan ke layar utama).</li>
                    <li>Konfirmasi pemasangan. Aplikasi siap diakses seperti aplikasi native!</li>
                  </ol>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-[#0D8A5B] hover:bg-[#09734a] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
