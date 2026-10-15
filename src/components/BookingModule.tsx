import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Trash2,
  Edit2,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface BookingModuleProps {
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  onRequestCashierPayment: (booking: Booking) => void;
}

export const BookingModule: React.FC<BookingModuleProps> = ({
  bookings,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onRequestCashierPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [status, setStatus] = useState<BookingStatus>('Dikonfirmasi');
  const [totalPrice, setTotalPrice] = useState<number>(350000);
  const [downPayment, setDownPayment] = useState<number>(100000);
  const [notes, setNotes] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const openAddModal = () => {
    setEditingBooking(null);
    setCustomerName('');
    setPhone('');
    setServiceName('');
    setDate(todayStr);
    setStartTime('09:00');
    setEndTime('10:00');
    setStatus('Dikonfirmasi');
    setTotalPrice(300000);
    setDownPayment(100000);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setCustomerName(booking.customerName);
    setPhone(booking.phone);
    setServiceName(booking.serviceName);
    setDate(booking.date);
    setStartTime(booking.startTime);
    setEndTime(booking.endTime);
    setStatus(booking.status);
    setTotalPrice(booking.totalPrice);
    setDownPayment(booking.downPayment);
    setNotes(booking.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !serviceName || !date) return;

    const remaining = Math.max(0, Number(totalPrice) - Number(downPayment));

    if (editingBooking) {
      const updated: Booking = {
        ...editingBooking,
        customerName,
        phone,
        serviceName,
        date,
        startTime,
        endTime,
        status,
        totalPrice: Number(totalPrice),
        downPayment: Number(downPayment),
        remainingPayment: remaining,
        notes,
      };
      onUpdateBooking(updated);
    } else {
      const newBooking: Booking = {
        id: `BK-${Date.now().toString().slice(-4)}`,
        customerName,
        phone,
        serviceName,
        date,
        startTime,
        endTime,
        status,
        totalPrice: Number(totalPrice),
        downPayment: Number(downPayment),
        remainingPayment: remaining,
        notes,
        createdAt: new Date().toISOString(),
      };
      onAddBooking(newBooking);
    }

    setIsModalOpen(false);
  };

  const handleSendWhatsApp = (booking: Booking) => {
    let cleanPhone = booking.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = `Halo Kak ${booking.customerName}, kami dari Studio ingin mengonfirmasi jadwal booking Anda:\n\n` +
      `📅 Tanggal: ${booking.date}\n` +
      `⏰ Waktu: ${booking.startTime} - ${booking.endTime} WIB\n` +
      `📸 Paket: ${booking.serviceName}\n` +
      `💰 Total: Rp ${booking.totalPrice.toLocaleString('id-ID')}\n` +
      `💵 DP: Rp ${booking.downPayment.toLocaleString('id-ID')}\n` +
      `💳 Sisa Tagihan: Rp ${booking.remainingPayment.toLocaleString('id-ID')}\n\n` +
      `Mohon hadir 10 menit sebelum sesi dimulai. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      const matchesSearch =
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone.includes(searchTerm) ||
        b.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      // Date
      if (dateFilter === 'TODAY' && b.date !== todayStr) return false;
      if (dateFilter === 'TOMORROW' && b.date !== tomorrowStr) return false;
      if (dateFilter === 'CUSTOM' && customDate && b.date !== customDate) return false;

      return true;
    }).sort((a, b) => {
      const dateA = `${a.date} ${a.startTime}`;
      const dateB = `${b.date} ${b.startTime}`;
      return dateB.localeCompare(dateA); // Most recent first
    });
  }, [bookings, searchTerm, statusFilter, dateFilter, customDate, todayStr, tomorrowStr]);

  // Statistics
  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const confirmedCount = bookings.filter((b) => b.status === 'Dikonfirmasi').length;
    const completedCount = bookings.filter((b) => b.status === 'Selesai').length;
    const totalPotential = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      todayCount: todayBookings.length,
      confirmedCount,
      completedCount,
      totalPotential,
    };
  }, [bookings, todayStr]);

  const getStatusBadge = (statusName: BookingStatus) => {
    switch (statusName) {
      case 'Dikonfirmasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Dikonfirmasi
          </span>
        );
      case 'Menunggu Konfirmasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Menunggu
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Selesai
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Jadwal Hari Ini</span>
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.todayCount} Sesi</div>
          <p className="text-[11px] text-slate-500 mt-1">Tanggal: {todayStr}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Dikonfirmasi (Aktif)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.confirmedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Siap disesi / berlangsung</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Sesi Selesai</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.completedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total riwayat sukses</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Estimasi Nilai Booking</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            Rp {stats.totalPotential.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dari semua pesanan booking</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and New Booking Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pelanggan, no WA, paket foto, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TODAY')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'TODAY' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TOMORROW')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'TOMORROW' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Besok
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="Dikonfirmasi">Dikonfirmasi</option>
            <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          {/* Add Booking Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-[#0D8A5B] hover:bg-[#09734a] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ml-auto"
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Tambah Booking</span>
          </button>
        </div>
      </div>

      {/* Booking List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#0D8A5B]" />
            <h3 className="font-bold text-slate-900 text-base">Daftar Jadwal Booking</h3>
            <span className="text-xs text-slate-500 font-normal">
              ({filteredBookings.length} jadwal ditemukan)
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Tersimpan di Sheet: Jadwal_Booking
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h4 className="font-semibold text-slate-800">Tidak ada jadwal booking yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba sesuaikan pencarian atau filter tanggal Anda, atau klik tombol Tambah Booking untuk membuat jadwal baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                  <th className="px-5 py-3">Pelanggan &amp; Layanan</th>
                  <th className="px-4 py-3">Jadwal Sesi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D8A5B] border border-emerald-200 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{b.customerName}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {b.id}
                            </span>
                          </div>
                          <p className="text-xs text-[#0D8A5B] font-semibold mt-0.5">{b.serviceName}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{b.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{b.date}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {b.startTime} - {b.endTime}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(b.status)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        Rp {b.totalPrice.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        DP: <span className="text-emerald-600 font-medium">Rp {b.downPayment.toLocaleString('id-ID')}</span>
                      </div>
                      {b.remainingPayment > 0 ? (
                        <div className="text-[11px] text-rose-600 font-medium">
                          Sisa: Rp {b.remainingPayment.toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          Lunas
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="text-xs text-slate-600 truncate" title={b.notes}>
                        {b.notes || '-'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Reminder */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(b)}
                          title="Kirim Konfirmasi / Pengingat WhatsApp"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Pay Remaining in Cashier */}
                        {b.remainingPayment > 0 && (
                          <button
                            type="button"
                            onClick={() => onRequestCashierPayment(b)}
                            title="Catat Pelunasan di Kasir"
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Kasir</span>
                          </button>
                        )}

                        {/* Edit Booking */}
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          title="Edit Booking"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Booking */}
                        <button
                          type="button"
                          onClick={() => onDeleteBooking(b.id)}
                          title="Hapus Booking"
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

      {/* Add / Edit Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBooking ? 'Edit Jadwal Booking' : 'Tambah Booking Pelanggan'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rina Melati"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paket / Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Wisuda + 5 Foto Edit"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DP / Uang Muka (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Sisa Tagihan Pelanggan:</span>
                <span className="font-bold text-slate-900 text-sm">
                  Rp {Math.max(0, Number(totalPrice) - Number(downPayment)).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Dikonfirmasi">Dikonfirmasi</option>
                  <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bawa baju adat sendiri, butuh background abu-abu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D8A5B] hover:bg-[#09734a] rounded-lg shadow-xs cursor-pointer"
                >
                  {editingBooking ? 'Simpan Perubahan' : 'Tambah Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
