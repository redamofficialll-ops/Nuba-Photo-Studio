import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  AlertTriangle,
  Boxes,
  MapPin,
  Trash2,
  Edit2,
  FileSpreadsheet,
  XCircle,
  PlusCircle,
  MinusCircle,
  Link,
  ShieldAlert,
} from 'lucide-react';
import { InventoryItem, ItemStatus } from '../types';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onQuickAdjustQuantity: (itemId: string, delta: number) => void;
}

const CATEGORY_OPTIONS = [
  'Kamera & Lensa',
  'Lighting & Studio',
  'Properti & Kostum',
  'Dokumen & Kontrak',
  'Bahan Habis Pakai',
  'Aksesoris & Elektronik',
  'Lainnya',
];

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onQuickAdjustQuantity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('Unit');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [status, setStatus] = useState<ItemStatus>('Tersedia');
  const [location, setLocation] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setSku(`INV-${Date.now().toString().slice(-4)}`);
    setCategory(CATEGORY_OPTIONS[0]);
    setQuantity(1);
    setUnit('Unit');
    setCostPrice(0);
    setStatus('Tersedia');
    setLocation('Studio Utama');
    setDriveFileUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setCostPrice(item.costPrice);
    setStatus(item.status);
    setLocation(item.location);
    setDriveFileUrl(item.driveFileUrl || '');
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    if (editingItem) {
      const updated: InventoryItem = {
        ...editingItem,
        name,
        sku,
        category,
        quantity: Number(quantity),
        unit,
        costPrice: Number(costPrice),
        status,
        location,
        driveFileUrl,
        notes,
        updatedAt: new Date().toISOString(),
      };
      onUpdateItem(updated);
    } else {
      const newItem: InventoryItem = {
        id: `ITM-${Date.now().toString().slice(-4)}`,
        name,
        sku,
        category,
        quantity: Number(quantity),
        unit,
        costPrice: Number(costPrice),
        status,
        location,
        driveFileUrl,
        notes,
        updatedAt: new Date().toISOString(),
      };
      onAddItem(newItem);
    }

    setIsModalOpen(false);
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValuation = inventory.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
    const lowStockItems = inventory.filter((item) => item.quantity <= 2 && item.category !== 'Dokumen & Kontrak');

    return {
      totalSku: inventory.length,
      totalItems,
      totalValuation,
      lowStockCount: lowStockItems.length,
      lowStockList: lowStockItems,
    };
  }, [inventory]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  const getStatusBadge = (s: ItemStatus) => {
    switch (s) {
      case 'Tersedia':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Tersedia
          </span>
        );
      case 'Dipinjam':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Dipinjam
          </span>
        );
      case 'Perbaikan':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Perbaikan
          </span>
        );
      case 'Habis':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            Habis
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Item / SKU</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalSku} Jenis</div>
          <p className="text-[11px] text-slate-500 mt-1">{metrics.totalItems} unit/pcs total fisik</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Estimasi Nilai Aset</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            Rp {metrics.totalValuation.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total harga beli inventaris</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Peringatan Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics.lowStockCount} Item</div>
          <p className="text-[11px] text-slate-500 mt-1">Stok sisa &le; 2 unit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Terkoneksi File Google</span>
            <Link className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {inventory.filter((i) => i.driveFileUrl).length} File
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tautan Drive &amp; Dokumen</p>
        </div>
      </div>

      {/* Low Stock Alert Banner if applicable */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-900">Perhatian: Ada stok yang menipis!</span>
            <p className="text-amber-700 mt-0.5">
              Item berikut perlu segera diisi ulang:{' '}
              {metrics.lowStockList.map((i) => `${i.name} (sisa ${i.quantity} ${i.unit})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Filters, and New Item */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama barang, SKU, lokasi rak, dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Perbaikan">Perbaikan</option>
            <option value="Habis">Habis</option>
          </select>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-[#0D8A5B] hover:bg-[#09734a] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ml-auto"
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Tambah Item / File</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0D8A5B]" />
            <h3 className="font-bold text-slate-900 text-base">Katalog Inventaris &amp; File Aset</h3>
            <span className="text-xs text-slate-500">
              ({filteredInventory.length} item)
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Tersimpan di Sheet: Inventaris_File
          </span>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800">Tidak ada item inventaris ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol Tambah Item / File untuk mencatat peralatan, properti studio, atau link berkas Google Drive Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                  <th className="px-5 py-3">Nama Barang / Dokumen</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3">Harga Beli / Satuan</th>
                  <th className="px-4 py-3">Status &amp; Lokasi</th>
                  <th className="px-4 py-3">File / Drive</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.sku}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={item.notes}>
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => onQuickAdjustQuantity(item.id, -1)}
                          title="Kurangi stok"
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-slate-800 text-xs min-w-[32px] text-center">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => onQuickAdjustQuantity(item.id, 1)}
                          title="Tambah stok"
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800">
                      {item.costPrice > 0 ? `Rp ${item.costPrice.toLocaleString('id-ID')}` : '-'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div>{getStatusBadge(item.status)}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.location || 'Studio'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.driveFileUrl ? (
                        <a
                          href={item.driveFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded-md"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka File</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit Item"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          title="Hapus Item"
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

      {/* Add / Edit Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Item Inventaris' : 'Tambah Inventaris & File'}
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
                    Nama Barang / Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamera Sony A7 III"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SKU / Aset *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CAM-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Barang
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ItemStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dipinjam">Dipinjam</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    placeholder="Unit / Pcs / Set"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga / Nilai (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Rak / Penyimpanan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Drybox Studio A / Lemari Kostum 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link File Google Drive / Foto Aset / Dokumen
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveFileUrl}
                  onChange={(e) => setDriveFileUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi, serial number, atau riwayat perawatan..."
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
