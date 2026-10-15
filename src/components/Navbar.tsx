import React from 'react';
import {
  Calendar,
  Wallet,
  Package,
  LayoutDashboard,
  RefreshCw,
  Code2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Database,
  User as UserIcon,
} from 'lucide-react';
import { SyncState, GoogleSheetsConfig, SupabaseConfig, StudioUser } from '../types';
import { NubaLogo } from './NubaLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'dashboard' | 'bookings' | 'cashier' | 'inventory';
  setActiveTab: (tab: 'dashboard' | 'bookings' | 'cashier' | 'inventory') => void;
  user: StudioUser | null;
  syncState: SyncState;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onLogout: () => void;
  onManualSync: () => void;
  onOpenAppsScriptGuide: () => void;
  sheetsConfig: GoogleSheetsConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  syncState,
  supabaseConfig,
  onOpenSupabaseModal,
  onLogout,
  onManualSync,
  onOpenAppsScriptGuide,
  sheetsConfig,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-900/10 shadow-xs">
      {/* Top Banner & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo & Brand: Nuba Photo Studio */}
          <div className="flex items-center gap-3">
            <NubaLogo size="md" withDriveBadge={true} allowEdit={true} />
          </div>

          {/* Sync & Supabase Database Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button for Android & iOS */}
            <PWAInstallButton />

            {/* Supabase Connection Status Badge / Button */}
            {supabaseConfig.isConnected ? (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                title="Kelola Koneksi Database Supabase"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                <Database className="w-3.5 h-3.5 text-[#0D8A5B]" />
                <span className="hidden md:inline">Supabase PostgreSQL</span>
                <span className="md:hidden">Supabase</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0D8A5B] to-[#063F29] hover:from-[#09734a] hover:to-[#042d1d] rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden sm:inline">Hubungkan Supabase</span>
                <span className="sm:hidden">Supabase</span>
              </button>
            )}

            {/* Sync State Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              {syncState.status === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0D8A5B]" />
              ) : syncState.status === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D8A5B]" />
              )}
              <span className="font-medium truncate max-w-[150px]">
                {syncState.status === 'syncing' ? 'Menyinkronkan...' : syncState.message}
              </span>
            </div>

            {/* Quick Sync Button */}
            <button
              type="button"
              onClick={onManualSync}
              disabled={syncState.status === 'syncing'}
              title="Sinkronkan data sekarang"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin text-[#0D8A5B]' : ''}`}
              />
              <span className="hidden sm:inline">Sinkron</span>
            </button>

            {/* Apps Script Helper Button */}
            <button
              type="button"
              onClick={onOpenAppsScriptGuide}
              title="Panduan Google Sheets & Apps Script"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Apps Script</span>
            </button>

            {/* User Profile / Supabase Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-[#0D8A5B] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0D8A5B] text-white font-bold text-xs flex items-center justify-center">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium leading-tight">Supabase Auth</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar Akun"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Masuk</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-100 py-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-[#0D8A5B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'bookings'
                ? 'bg-[#0D8A5B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal Booking &amp; Pelanggan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashier')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'cashier'
                ? 'bg-[#0D8A5B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kasir &amp; Keuangan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-[#0D8A5B] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventaris &amp; File</span>
          </button>
        </div>
      </div>
    </header>
  );
};
