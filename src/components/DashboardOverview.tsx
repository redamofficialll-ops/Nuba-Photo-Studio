import React from 'react';
import {
  Calendar,
  Wallet,
  Package,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Booking, CashierTransaction, InventoryItem, GoogleSheetsConfig, SyncState, SupabaseConfig } from '../types';
import { NubaLogo } from './NubaLogo';
import { GoogleDriveLogo, GoogleSheetsLogo } from './GoogleDriveLogo';
import { Database } from 'lucide-react';

interface DashboardOverviewProps {
  bookings: Booking[];
  transactions: CashierTransaction[];
  inventory: InventoryItem[];
  sheetsConfig: GoogleSheetsConfig;
  syncState: SyncState;
  supabaseConfig: SupabaseConfig;
  onNavigateTab: (tab: 'bookings' | 'cashier' | 'inventory') => void;
  onViewReceipt: (trx: CashierTransaction) => void;
  onManualSync: () => void;
  onOpenAppsScriptGuide: () => void;
  onCreateNewSheet: () => void;
  onOpenSupabaseModal: () => void;
  isLoggedIn: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  bookings,
  transactions,
  inventory,
  sheetsConfig,
  syncState,
  supabaseConfig,
  onNavigateTab,
  onViewReceipt,
  onManualSync,
  onOpenAppsScriptGuide,
  onCreateNewSheet,
  onOpenSupabaseModal,
  isLoggedIn,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Financial Summary
  const totalIncome = transactions
    .filter((t) => t.type === 'MASUK')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'KELUAR')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  // Bookings Today
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const upcomingBookings = bookings
    .filter((b) => b.date >= todayStr && b.status !== 'Dibatalkan' && b.status !== 'Selesai')
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, 5);

  // Recent Transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Inventory Valuation
  const totalValuation = inventory.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);

  const handleSendWhatsApp = (booking: Booking) => {
    let cleanPhone = booking.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = `Halo Kak ${booking.customerName}, konfirmasi jadwal sesi foto Anda hari ini: ${booking.startTime} - ${booking.endTime} WIB. Terima kasih!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner: Nuba Studio Signature Style */}
      <div className="bg-gradient-to-r from-[#063f29] via-[#0D8A5B] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 bg-[radial-gradient(circle_at_top_right,_#F59E0B,_transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Integrated Logo & Database Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-3 bg-white/95 rounded-2xl p-2 px-3.5 shadow-lg border border-white/30 backdrop-blur-md">
                <NubaLogo size="sm" />
                <div className="h-6 w-[1.5px] bg-slate-200" />
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#3ECF8E]/20 text-[#0D8A5B] flex items-center justify-center font-bold">
                    <Database className="w-3.5 h-3.5 text-[#0D8A5B]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black text-slate-800 leading-tight">Supabase PostgreSQL</span>
                    <span className="text-[9px] font-bold text-emerald-700 leading-tight flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {supabaseConfig.isConnected ? 'Cloud Real-Time' : 'Siap Dihubungkan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Kelola Booking, Kasir &amp; Inventaris</span>
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Semua data disimpan permanen di <b>Supabase Cloud PostgreSQL</b> secara real-time. Saat halaman di-refresh, riwayat transaksi, jadwal booking dan inventaris aman dan tidak akan hilang!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="px-4 py-2.5 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-950" />
              <span>{supabaseConfig.isConnected ? 'Kelola Supabase' : 'Hubungkan Supabase'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAppsScriptGuide}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-emerald-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-xs"
            >
              <span>Google Sheets &amp; Apps Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Kas */}
        <div
          onClick={() => onNavigateTab('cashier')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0D8A5B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Kas Bersih</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0D8A5B] group-hover:bg-emerald-100 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rp {currentBalance.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Pemasukan: Rp {totalIncome.toLocaleString('id-ID')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0D8A5B] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* KPI 2: Booking Hari Ini */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#F59E0B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Booking Hari Ini</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B] group-hover:bg-amber-100 transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D8A5B]">
            {todayBookings.length} Sesi
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Total booking: {bookings.length} klien</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* KPI 3: Total Nilai Aset */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0D8A5B] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Aset Inventaris</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0D8A5B] group-hover:bg-emerald-100 transition-colors">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            Rp {totalValuation.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{inventory.length} item terdata</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0D8A5B] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* KPI 4: Status Sinkronisasi Real-Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Status Database</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[#0D8A5B] font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real-Time Sheets</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tab: Booking, Kasir, Inventaris
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onManualSync}
              disabled={syncState.status === 'syncing' || !sheetsConfig.spreadsheetId}
              className="text-xs font-semibold text-[#0D8A5B] hover:text-[#09734a] flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncState.status === 'syncing' ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Bookings & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0D8A5B]" />
              <h3 className="font-bold text-slate-900 text-sm">Jadwal Booking Terdekat</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('bookings')}
              className="text-xs font-semibold text-[#0D8A5B] hover:text-[#09734a] flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 divide-y divide-slate-100 flex-1">
            {upcomingBookings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada jadwal booking aktif mendatang.
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div key={b.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {b.customerName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{b.serviceName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Clock className="w-3 h-3 text-[#F59E0B]" />
                        {b.date} ({b.startTime} - {b.endTime})
                      </span>
                      <span>Sisa: Rp {b.remainingPayment.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(b)}
                    title="Kirim Konfirmasi WhatsApp"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Cashier Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#0D8A5B]" />
              <h3 className="font-bold text-slate-900 text-sm">Aktivitas Kasir Terbaru</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('cashier')}
              className="text-xs font-semibold text-[#0D8A5B] hover:text-[#09734a] flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Kasir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 divide-y divide-slate-100 flex-1">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi kasir yang dicatat.
              </div>
            ) : (
              recentTransactions.map((trx) => (
                <div key={trx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          trx.type === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {trx.type}
                      </span>
                      <span className="font-semibold text-slate-800 text-xs truncate">
                        {trx.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{trx.description}</p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {trx.date} • {trx.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        trx.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {trx.type === 'MASUK' ? '+' : '-'} Rp{' '}
                      {trx.amount.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewReceipt(trx)}
                      title="Lihat Struk"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
