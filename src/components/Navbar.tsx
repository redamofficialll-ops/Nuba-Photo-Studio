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
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 z-40 shadow-xs">
      {/* Top Brand Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <NubaLogo size="sm" withDriveBadge={true} allowEdit={true} />
      </div>

      {/* Navigation Menu (Vertical Sidebar List) */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</p>
        
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#0D8A5B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-[#0D8A5B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Jadwal Booking & Pelanggan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashier')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'cashier'
              ? 'bg-[#0D8A5B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Kasir & Keuangan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#0D8A5B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Inventaris & File</span>
        </button>
      </div>

      {/* Database, Sync & Integration Status Section at Bottom of Sidebar */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        <div>
          <PWAInstallButton />
        </div>

        {/* Supabase Connection Button */}
        {supabaseConfig.isConnected ? (
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            title="Kelola Koneksi Database Supabase"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
              <Database className="w-3.5 h-3.5 text-[#0D8A5B]" />
              <span>Supabase Terhubung</span>
            </div>
            <span className="text-[10px] text-emerald-600 underline">Kelola</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className="w-full px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0D8A5B] to-[#063F29] hover:from-[#09734a] hover:to-[#042d1d] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Hubungkan Supabase</span>
          </button>
        )}

        {/* Sync Status & Action */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
            {syncState.status === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0D8A5B] shrink-0" />
            ) : syncState.status === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0D8A5B] shrink-0" />
            )}
            <span className="font-medium truncate text-[11px]">
              {syncState.status === 'syncing' ? 'Menyinkronkan...' : syncState.message}
            </span>
          </div>

          <button
            type="button"
            onClick={onManualSync}
            disabled={syncState.status === 'syncing'}
            title="Sinkronkan data sekarang"
            className="p-2 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin text-[#0D8A5B]' : ''}`}
            />
          </button>
        </div>

        {/* Apps Script Guide */}
        <button
          type="button"
          onClick={onOpenAppsScriptGuide}
          title="Panduan Google Sheets & Apps Script"
          className="w-full px-3 py-2 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Google Apps Script</span>
        </button>

        {/* User Profile / Auth */}
        <div className="pt-2 border-t border-slate-200">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-[#0D8A5B] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0D8A5B] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium leading-tight">Supabase Auth</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Keluar Akun"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
