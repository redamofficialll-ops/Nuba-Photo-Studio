import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { generateAppsScriptCode } from '../services/sheetsService';
import { GoogleDriveLogo, GoogleSheetsLogo } from './GoogleDriveLogo';
import { NubaLogo } from './NubaLogo';

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  spreadsheetUrl: string;
  appScriptUrl: string;
  onSaveAppScriptUrl: (url: string) => void;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  spreadsheetUrl,
  appScriptUrl,
  onSaveAppScriptUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(appScriptUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const scriptCode = generateAppsScriptCode(spreadsheetId);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAppScriptUrl(inputUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header with Nuba & Google Drive */}
        <div className="px-6 py-5 border-b border-emerald-900/20 flex items-center justify-between bg-[#063f29] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-xs">
              <GoogleDriveLogo size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Integrasi Google Apps Script &amp; Drive</span>
              </h2>
              <p className="text-xs text-emerald-200">
                Otomasi Database Real-Time • Nuba Photo Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Status Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-[#0D8A5B] rounded-lg shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Spreadsheet Utama Aktif
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  ID: <span className="font-mono text-slate-800">{spreadsheetId || 'Belum Terhubung'}</span>
                </p>
              </div>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D8A5B] hover:bg-[#09734a] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
              >
                <span>Buka Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Quick Steps */}
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Cara Pasang Google Apps Script (Opsional Tambahan)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-semibold text-xs text-slate-900">Buka Menu Ekstensi</h4>
                <p className="text-[11px] text-slate-500">
                  Di Google Sheets Anda, klik menu <b>Ekstensi</b> &gt; <b>Apps Script</b>.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-semibold text-xs text-slate-900">Tempel Kode .gs</h4>
                <p className="text-[11px] text-slate-500">
                  Hapus kode bawaan di editor, lalu paste (tempel) kode di bawah dan tekan <b>Simpan (Ctrl+S)</b>.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-semibold text-xs text-slate-900">Deploy Web App</h4>
                <p className="text-[11px] text-slate-500">
                  Klik <b>Terapkan (Deploy)</b> &gt; <b>Penerapan baru</b> &gt; Jenis <b>Aplikasi Web</b> &gt; Akses: <b>Siapa saja</b>.
                </p>
              </div>
            </div>
          </div>

          {/* Code Viewer & Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Source Code: Code.gs</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Apps Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200">
              <pre className="p-4 text-xs font-mono max-h-56 overflow-y-auto leading-relaxed select-all">
                {scriptCode}
              </pre>
            </div>
          </div>

          {/* Web App URL Config Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-semibold text-slate-900 text-xs">
              Tautkan Web App URL Apps Script (Opsional):
            </h4>
            <p className="text-xs text-slate-500">
              Jika Anda telah men-deploy Apps Script sebagai Aplikasi Web, tempelkan URL Web App (contoh: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">https://script.google.com/macros/s/.../exec</code>) untuk koneksi dua arah.
            </p>
            <form onSubmit={handleSaveUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Simpan URL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {saveSuccess && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>URL Web App berhasil disimpan!</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Aplikasi ini sudah tersambung langsung ke Google Sheets API secara real-time.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
