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
      {/* Welcome Banner: Clean Signature Style */}
      <div className="bg-gradient-to-r from-[#063f29] via-[#0D8A5B] to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 bg-[radial-gradient(circle_at_top_right,_#F59E0B,_transparent_70%)] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Kelola Booking, Kasir &amp; Inventaris
          </h1>
        </div>
      </div>

      {/* Main KPI Grid - 1 Horizontal Row Side-by-Side Without Scroll */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {/* KPI 1: Saldo Kas */}
        <div
          onClick={() => onNavigateTab('cashier')}
          className="bg-white p-2 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-[#0D8A5B] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight truncate">Saldo Kas</span>
            <div className="p-1 rounded-md bg-emerald-50 text-[#0D8A5B] group-hover:bg-emerald-100 transition-colors shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-lg font-black text-slate-900 truncate">
            Rp {currentBalance.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="truncate">Masuk: Rp {totalIncome.toLocaleString('id-ID')}</span>
            <ArrowRight className="w-3 h-3 text-[#0D8A5B] shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
          </div>
        </div>

        {/* KPI 2: Booking Hari Ini */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-2 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-[#F59E0B] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight truncate">Booking</span>
            <div className="p-1 rounded-md bg-amber-50 text-[#F59E0B] group-hover:bg-amber-100 transition-colors shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-lg font-black text-[#0D8A5B] truncate">
            {todayBookings.length} Sesi
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="truncate">Tot: {bookings.length}</span>
            <ArrowRight className="w-3 h-3 text-[#F59E0B] shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
          </div>
        </div>

        {/* KPI 3: Total Nilai Aset */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-2 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-[#0D8A5B] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight truncate">Inventaris</span>
            <div className="p-1 rounded-md bg-emerald-50 text-[#0D8A5B] group-hover:bg-emerald-100 transition-colors shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-lg font-black text-slate-900 truncate">
            Rp {totalValuation.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="truncate">{inventory.length} item</span>
            <ArrowRight className="w-3 h-3 text-[#0D8A5B] shrink-0 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
          </div>
        </div>

        {/* KPI 4: Status Sinkronisasi Real-Time */}
        <div className="bg-white p-2 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight truncate">Database</span>
            <div className="p-1 rounded-md bg-amber-50 text-[#F59E0B] shrink-0">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[#0D8A5B] font-bold text-[10px] sm:text-xs truncate">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">Supabase</span>
            </div>
            <p className="text-[8px] sm:text-[10px] text-slate-500 truncate mt-0.5">
              {supabaseConfig.isConnected ? 'Aktif' : 'Lokal'}
            </p>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="text-[9px] sm:text-[11px] font-semibold text-[#0D8A5B] hover:text-[#09734a] flex items-center gap-0.5 cursor-pointer truncate"
            >
              <RefreshCw className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Kelola</span>
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
