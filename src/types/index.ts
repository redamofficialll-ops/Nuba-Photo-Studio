export type BookingStatus = 'Menunggu Konfirmasi' | 'Dikonfirmasi' | 'Selesai' | 'Dibatalkan';

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  totalPrice: number;
  downPayment: number; // DP
  remainingPayment: number; // Sisa
  notes?: string;
  createdAt: string;
}

export type TransactionType = 'MASUK' | 'KELUAR';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer Bank' | 'Kartu Debit';

export interface CashierTransaction {
  id: string;
  date: string; // ISO string / YYYY-MM-DD HH:mm
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  customerOrReference?: string;
  receiptUrl?: string;
  createdAt: string;
}

export type ItemStatus = 'Tersedia' | 'Dipinjam' | 'Perbaikan' | 'Habis';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string; // Pcs, Unit, Set, Lembar, Rol
  costPrice: number; // Nilai satuan / Harga beli
  status: ItemStatus;
  location: string;
  driveFileUrl?: string; // Link file / foto Google Drive
  notes?: string;
  updatedAt: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  appScriptUrl?: string;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected';
  message: string;
  lastSyncTime?: Date;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string | null;
}

export interface StudioUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

