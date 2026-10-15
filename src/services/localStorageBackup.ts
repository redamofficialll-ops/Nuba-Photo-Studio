import { Booking, CashierTransaction, InventoryItem, GoogleSheetsConfig } from '../types';

const STORAGE_KEYS = {
  BOOKINGS: 'app_studio_bookings_v1',
  TRANSACTIONS: 'app_studio_transactions_v1',
  INVENTORY: 'app_studio_inventory_v1',
  SHEETS_CONFIG: 'app_studio_sheets_config_v1',
};

const getTodayDateString = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'BK-1001',
    customerName: 'Siti Rahmawati',
    phone: '081234567890',
    serviceName: 'Paket Wisuda Silver (5 Foto Edit + Cetak 10R)',
    date: getTodayDateString(0),
    startTime: '09:00',
    endTime: '10:30',
    status: 'Dikonfirmasi',
    totalPrice: 350000,
    downPayment: 150000,
    remainingPayment: 200000,
    notes: 'Keluarga 4 orang, bawa toga sendiri.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-1002',
    customerName: 'Budi Santoso & Maya',
    phone: '085712349988',
    serviceName: 'Prewedding Outdoor Studio',
    date: getTodayDateString(0),
    startTime: '13:30',
    endTime: '15:30',
    status: 'Dikonfirmasi',
    totalPrice: 1200000,
    downPayment: 500000,
    remainingPayment: 700000,
    notes: 'Konsep kasual & formal, request background warna krem.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-1003',
    customerName: 'Dimas Anggara',
    phone: '082199887766',
    serviceName: 'Pas Foto Kilat + Softfile CV',
    date: getTodayDateString(1),
    startTime: '10:00',
    endTime: '10:30',
    status: 'Menunggu Konfirmasi',
    totalPrice: 65000,
    downPayment: 0,
    remainingPayment: 65000,
    notes: 'Background merah dan biru untuk berkas BUMN.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-1004',
    customerName: 'Alifah Nuraini',
    phone: '087811223344',
    serviceName: 'Foto Group & Bestie (6 Orang)',
    date: getTodayDateString(-1),
    startTime: '15:00',
    endTime: '16:00',
    status: 'Selesai',
    totalPrice: 450000,
    downPayment: 450000,
    remainingPayment: 0,
    notes: 'Lunas di kasir, foto sudah dikirim via Google Drive.',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TRANSACTIONS: CashierTransaction[] = [
  {
    id: 'TRX-20261015-01',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    type: 'MASUK',
    category: 'Pembayaran Booking',
    description: 'Pelunasan Foto Group Bestie (Alifah Nuraini)',
    amount: 450000,
    paymentMethod: 'QRIS',
    customerOrReference: 'Alifah Nuraini (BK-1004)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'TRX-20261015-02',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    type: 'MASUK',
    category: 'Uang Muka / DP',
    description: 'DP Paket Wisuda Silver (Siti Rahmawati)',
    amount: 150000,
    paymentMethod: 'Transfer Bank',
    customerOrReference: 'Siti Rahmawati (BK-1001)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'TRX-20261015-03',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    type: 'KELUAR',
    category: 'Operasional',
    description: 'Kertas Foto Glossy A4 & Tinta Printer Epson 6 Warna',
    amount: 285000,
    paymentMethod: 'Tunai',
    customerOrReference: 'Toko ATK & Foto Berkah',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'TRX-20261015-04',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    type: 'KELUAR',
    category: 'Konsumsi & Kebersihan',
    description: 'Beli air mineral galon dan snack tamu studio',
    amount: 55000,
    paymentMethod: 'Tunai',
    customerOrReference: 'Minimarket',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-001',
    sku: 'CAM-SONY-A7M3',
    name: 'Kamera Sony A7 III Body Only',
    category: 'Kamera & Lensa',
    quantity: 2,
    unit: 'Unit',
    costPrice: 22000000,
    status: 'Tersedia',
    location: 'Drybox Studio A, Rak 1',
    driveFileUrl: 'https://drive.google.com/',
    notes: 'Kondisi mulus, sensor bersih, shutter count 24k.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INV-002',
    sku: 'LNS-SIG-2470',
    name: 'Lensa Sigma 24-70mm f/2.8 DG DN Art',
    category: 'Kamera & Lensa',
    quantity: 1,
    unit: 'Unit',
    costPrice: 14500000,
    status: 'Tersedia',
    location: 'Drybox Studio A, Rak 2',
    driveFileUrl: 'https://drive.google.com/',
    notes: 'Lensa utama untuk sesi indoor/outdoor.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INV-003',
    sku: 'LGT-GDX-SK400',
    name: 'Godox SK400II Flash Strobe Studio + Softbox Octa 120cm',
    category: 'Lighting & Studio',
    quantity: 3,
    unit: 'Set',
    costPrice: 2100000,
    status: 'Tersedia',
    location: 'Studio Utama Stand 1-3',
    driveFileUrl: 'https://drive.google.com/',
    notes: 'Trigger Godox X2T kompatibel Sony.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INV-004',
    sku: 'DOC-KTR-WED26',
    name: 'Template Surat Kontrak Wedding & Event 2026',
    category: 'Dokumen & Kontrak',
    quantity: 1,
    unit: 'Dokumen',
    costPrice: 0,
    status: 'Tersedia',
    location: 'Google Drive Dokumen Bisnis',
    driveFileUrl: 'https://docs.google.com/document/d/',
    notes: 'Format PDF & Docx resmi untuk kesepakatan klien.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INV-005',
    sku: 'PRP-WIS-TOGA',
    name: 'Set Toga & Tabung Ijazah Wisuda Prop',
    category: 'Properti & Kostum',
    quantity: 5,
    unit: 'Set',
    costPrice: 150000,
    status: 'Tersedia',
    location: 'Lemari Kostum No. 3',
    driveFileUrl: 'https://drive.google.com/',
    notes: 'Warna kerah: Kuning, Merah, Biru, Hijau.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INV-006',
    sku: 'BHP-KRT-10R',
    name: 'Kertas Foto Premium Silky 10R (Isi 50 Lembar)',
    category: 'Bahan Habis Pakai',
    quantity: 2,
    unit: 'Pack',
    costPrice: 85000,
    status: 'Tersedia',
    location: 'Laci Printer Meja Kasir',
    driveFileUrl: '',
    notes: 'Sisa stok tinggal 2 pack, segera restock!',
    updatedAt: new Date().toISOString(),
  },
];

export const loadStoredBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      saveStoredBookings(DEFAULT_BOOKINGS);
      return DEFAULT_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading bookings from localStorage', e);
    return DEFAULT_BOOKINGS;
  }
};

export const saveStoredBookings = (data: Booking[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving bookings to localStorage', e);
  }
};

export const loadStoredTransactions = (): CashierTransaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveStoredTransactions(DEFAULT_TRANSACTIONS);
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading transactions from localStorage', e);
    return DEFAULT_TRANSACTIONS;
  }
};

export const saveStoredTransactions = (data: CashierTransaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving transactions to localStorage', e);
  }
};

export const loadStoredInventory = (): InventoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!raw) {
      saveStoredInventory(DEFAULT_INVENTORY);
      return DEFAULT_INVENTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading inventory from localStorage', e);
    return DEFAULT_INVENTORY;
  }
};

export const saveStoredInventory = (data: InventoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving inventory to localStorage', e);
  }
};

export const loadSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading sheets config', e);
  }
  return {
    spreadsheetId: '',
    spreadsheetTitle: '[Database] Manajemen Booking, Kasir & Inventaris',
    spreadsheetUrl: '',
    lastSyncedAt: null,
    autoSync: true,
    appScriptUrl: '',
  };
};

export const saveSheetsConfig = (config: GoogleSheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheets config', e);
  }
};
