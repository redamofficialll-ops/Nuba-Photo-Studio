import React, { useState } from 'react';
import {
  Database,
  X,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  ShieldCheck,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  reinitSupabaseClient,
  testSupabaseConnection,
  generateSupabaseSqlSchema,
  supabaseSignInWithEmail,
  supabaseSignUpWithEmail,
  supabaseSignOut,
} from '../services/supabaseClient';
import { SupabaseConfig, StudioUser } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: SupabaseConfig;
  onConfigUpdated: (config: SupabaseConfig) => void;
  user: StudioUser | null;
  onUserChanged: (user: StudioUser | null) => void;
  onTriggerSync: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  supabaseConfig,
  onConfigUpdated,
  user,
  onUserChanged,
  onTriggerSync,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'auth'>('config');

  // Config Form
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Auth Form
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setTestResult({ success: false, message: 'Harap isi Project URL dan Anon Key.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      const newConfig: SupabaseConfig = {
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      };
      saveStoredSupabaseConfig(newConfig);
      reinitSupabaseClient(newConfig.url, newConfig.anonKey);
      onConfigUpdated(newConfig);
      // Trigger instant sync
      setTimeout(() => {
        onTriggerSync();
      }, 500);
    }
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (authMode === 'login') {
        const loggedUser = await supabaseSignInWithEmail(email, password);
        onUserChanged(loggedUser);
        setAuthSuccess(`Selamat datang kembali, ${loggedUser.name || loggedUser.email}!`);
      } else {
        const newUser = await supabaseSignUpWithEmail(email, password, name);
        onUserChanged(newUser);
        setAuthSuccess('Pendaftaran berhasil! Akun Anda aktif.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Gagal autentikasi');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabaseSignOut();
    onUserChanged(null);
    setAuthSuccess('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-emerald-950/20 bg-gradient-to-r from-[#063F29] via-[#0D8A5B] to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-400/20 rounded-xl border border-emerald-400/30 text-[#3ECF8E]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">Integrasi Database Supabase</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30">
                  PostgreSQL Real-Time
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Database utama real-time &amp; autentikasi menggantikan Firebase sepenuhnya
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#0D8A5B] text-[#0D8A5B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Koneksi API Project
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-[#0D8A5B] text-[#0D8A5B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Skema Tabel SQL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'auth'
                ? 'border-[#0D8A5B] text-[#0D8A5B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Autentikasi Pengguna
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 flex-1">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#0D8A5B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Aplikasi kini terhubung langsung ke Supabase!</p>
                  <p className="text-slate-600">
                    Masukkan URL dan Anon Key dari dashboard proyek Supabase Anda. Semua data booking, kasir, dan inventaris akan tersimpan permanen di cloud PostgreSQL.
                  </p>
                </div>
              </div>

              <form onSubmit={handleTestAndSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <Database className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://xyzabcdefg.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D8A5B]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Ditemukan di: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Public Anon Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D8A5B]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Ditemukan di: Supabase Dashboard &gt; Project Settings &gt; API &gt; anon / public key
                  </span>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</p>
                      <p className="text-[11px] mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0D8A5B] font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Supabase Dashboard</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isTesting}
                    className="px-5 py-2.5 bg-[#0D8A5B] hover:bg-[#09734a] text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menguji Koneksi...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                        <span>Simpan &amp; Hubungkan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Skema Tabel Database PostgreSQL</h4>
                  <p className="text-xs text-slate-500">
                    Jalankan skrip SQL ini sekali di SQL Editor Supabase untuk membuat tabel otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-[#0D8A5B] hover:bg-[#09734a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 shadow-inner leading-relaxed">
                <pre>{generateSupabaseSqlSchema()}</pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <p className="font-bold">Langkah mudah mengeksekusi SQL:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 text-[11px]">
                  <li>Buka proyek Anda di Supabase &gt; klik menu <b>SQL Editor</b> di navigasi kiri.</li>
                  <li>Klik <b>New query</b> &gt; Tempelkan kode SQL di atas.</li>
                  <li>Klik tombol hijau <b>Run</b>. Tabel `bookings`, `cashier_transactions`, dan `inventory_items` langsung aktif seketika!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              {user ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0D8A5B] text-white flex items-center justify-center font-bold text-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{user.name || 'Pengguna Terdaftar'}</h4>
                      <p className="text-xs text-emerald-700">{user.email}</p>
                      <span className="text-[10px] text-slate-500">ID: {user.id.slice(0, 12)}...</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === 'login' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      Masuk (Login)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === 'register' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      Daftar (Register)
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                    {authMode === 'register' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          placeholder="Admin Studio"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D8A5B]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="admin@nubastudio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D8A5B]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kata Sandi</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D8A5B]"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                        {authError}
                      </div>
                    )}

                    {authSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px]">
                        {authSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 bg-[#0D8A5B] hover:bg-[#09734a] text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : authMode === 'login' ? (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Masuk dengan Supabase Auth</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Daftar Akun Baru</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span className="text-slate-600 font-medium">
              {supabaseConfig.isConnected ? 'Supabase Tersambung' : 'Belum Terhubung'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
