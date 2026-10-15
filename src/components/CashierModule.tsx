import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  Search,
  Calendar,
  CreditCard,
  Receipt,
  Trash2,
  Edit2,
  FileSpreadsheet,
  XCircle,
  Filter,
} from 'lucide-react';
import { CashierTransaction, TransactionType, PaymentMethod } from '../types';

interface CashierModuleProps {
  transactions: CashierTransaction[];
  onAddTransaction: (trx: CashierTransaction) => void;
  onUpdateTransaction: (trx: CashierTransaction) => void;
  onDeleteTransaction: (trxId: string) => void;
  onViewReceipt: (trx: CashierTransaction) => void;
}

const CATEGORY_PRESETS: Record<TransactionType, string[]> = {
  MASUK: [
    'Pembayaran Booking',
    'Uang Muka / DP',
    'Penjualan Cetak Foto & Frame',
    'Jasa Editing Softfile',
    'Sewa Studio & Kostum',
    'Penjualan Produk Inventaris',
    'Pemasukan Lainnya',
  ],
  KELUAR: [
    'Operasional & Utilitas',
    'Bahan Habis Pakai (Kertas/Tinta)',
    'Perlengkapan & Properti Baru',
    'Maintenance & Service Alat',
    'Gaji Kru / Fee Fotografer',
    'Konsumsi & Kebersihan',
    'Promosi & Iklan',
    'Pengeluaran Lainnya',
  ],
};

export const CashierModule: React.FC<CashierModuleProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onViewReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<CashierTransaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('MASUK');
  const [formCategory, setFormCategory] = useState(CATEGORY_PRESETS.MASUK[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(100000);
  const [formMethod, setFormMethod] = useState<PaymentMethod>('QRIS');
  const [formCustomerRef, setFormCustomerRef] = useState('');
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );

  const openAddModal = (defaultType: TransactionType = 'MASUK') => {
    setEditingTrx(null);
    setFormType(defaultType);
    setFormCategory(CATEGORY_PRESETS[defaultType][0]);
    setFormDescription('');
    setFormAmount(defaultType === 'MASUK' ? 250000 : 50000);
    setFormMethod('QRIS');
    setFormCustomerRef('');
    setFormDate(new Date().toISOString().slice(0, 16).replace('T', ' '));
    setIsModalOpen(true);
  };

  const openEditModal = (trx: CashierTransaction) => {
    setEditingTrx(trx);
    setFormType(trx.type);
    setFormCategory(trx.category);
    setFormDescription(trx.description);
    setFormAmount(trx.amount);
    setFormMethod(trx.paymentMethod);
    setFormCustomerRef(trx.customerOrReference || '');
    setFormDate(trx.date);
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setFormType(newType);
    setFormCategory(CATEGORY_PRESETS[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formAmount || formAmount <= 0) return;

    if (editingTrx) {
      const updated: CashierTransaction = {
        ...editingTrx,
        type: formType,
        category: formCategory,
        description: formDescription,
        amount: Number(formAmount),
        paymentMethod: formMethod,
        customerOrReference: formCustomerRef,
        date: formDate,
      };
      onUpdateTransaction(updated);
    } else {
      const nowStr = new Date().toISOString();
      const datePart = nowStr.slice(0, 10).replace(/-/g, '');
      const newTrx: CashierTransaction = {
        id: `TRX-${datePart}-${Date.now().toString().slice(-4)}`,
        type: formType,
        category: formCategory,
        description: formDescription,
        amount: Number(formAmount),
        paymentMethod: formMethod,
        customerOrReference: formCustomerRef,
        date: formDate,
        createdAt: nowStr,
      };
      onAddTransaction(newTrx);
    }

    setIsModalOpen(false);
  };

  // Metrics
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    transactions.forEach((t) => {
      if (t.type === 'MASUK') {
        totalIncome += t.amount;
        incomeCount++;
      } else {
        totalExpense += t.amount;
        expenseCount++;
      }
    });

    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
      incomeCount,
      expenseCount,
    };
  }, [transactions]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customerOrReference && t.customerOrReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (methodFilter !== 'ALL' && t.paymentMethod !== methodFilter) return false;

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, searchTerm, typeFilter, categoryFilter, methodFilter]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Balance */}
        <div className="bg-gradient-to-br from-[#063f29] via-[#0D8A5B] to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-400/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-100">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Saldo Kas Tersedia
            </span>
            <div className="p-2 rounded-xl bg-white/10 text-[#F59E0B]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rp {summary.balance.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-1">
              Selisih pemasukan bersih dikurangi pengeluaran
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#0D8A5B]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Kas Masuk (Pemasukan)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0D8A5B]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#0D8A5B]">
              Rp {summary.totalIncome.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.incomeCount} transaksi masuk tercatat
            </p>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Kas Keluar (Pengeluaran)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600">
              Rp {summary.totalExpense.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.expenseCount} transaksi pengeluaran tercatat
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Fast Entry Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi, keterangan, no TRX, klien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('MASUK')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'MASUK'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Kas Masuk
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('KELUAR')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'KELUAR'
                  ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Kas Keluar
            </button>
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">Semua Metode</option>
            <option value="Tunai">Tunai</option>
            <option value="QRIS">QRIS</option>
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="Kartu Debit">Kartu Debit</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white max-w-[160px] truncate"
          >
            <option value="ALL">Semua Kategori</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Quick Entry Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => openAddModal('MASUK')}
              className="px-3 py-2 bg-[#0D8A5B] hover:bg-[#09734a] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
              <span>Kas Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('KELUAR')}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Kas Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#0D8A5B]" />
            <h3 className="font-bold text-slate-900 text-base">Rekapitulasi Buku Kas &amp; Kasir</h3>
            <span className="text-xs text-slate-500">
              ({filteredTransactions.length} transaksi)
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Tersimpan di Sheet: Kasir_Keuangan
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">Belum ada transaksi ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gunakan tombol Kas Masuk atau Kas Keluar untuk mencatat transaksi keuangan kasir Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                  <th className="px-5 py-3">Waktu &amp; ID</th>
                  <th className="px-4 py-3">Kategori &amp; Keterangan</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Nominal (Rp)</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{trx.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{trx.id}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            trx.type === 'MASUK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trx.type === 'MASUK' ? 'MASUK' : 'KELUAR'}
                        </span>
                        <span className="font-semibold text-slate-900 text-xs">{trx.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{trx.description}</p>
                      {trx.customerOrReference && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Ref: {trx.customerOrReference}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        {trx.paymentMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div
                        className={`text-sm sm:text-base font-black ${
                          trx.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {trx.type === 'MASUK' ? '+' : '-'} Rp{' '}
                        {trx.amount.toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trx)}
                          title="Lihat / Cetak Struk"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(trx)}
                          title="Edit Transaksi"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(trx.id)}
                          title="Hapus Transaksi"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Cashier Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTrx
                  ? 'Edit Transaksi Kasir'
                  : formType === 'MASUK'
                  ? 'Catat Kas Masuk (Pemasukan)'
                  : 'Catat Kas Keluar (Pengeluaran)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('MASUK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formType === 'MASUK'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Pemasukan (Uang Masuk)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('KELUAR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formType === 'KELUAR'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Pengeluaran (Uang Keluar)</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-base font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORY_PRESETS[formType].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Pembayaran *
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Tunai">Tunai (Cash)</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Kartu Debit">Kartu Debit</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Rinci *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formType === 'MASUK'
                      ? 'Contoh: Pelunasan foto wisuda Siti / Cetak 3 frame 10R'
                      : 'Contoh: Beli 2 rim kertas foto Silky & lakban packaging'
                  }
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Customer / Reference & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelanggan / Vendor / No. Nota (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Siti Rahmawati / Toko ATK"
                    value={formCustomerRef}
                    onChange={(e) => setFormCustomerRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal &amp; Waktu
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs cursor-pointer ${
                    formType === 'MASUK'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingTrx ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
