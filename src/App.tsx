import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Booking,
  CashierTransaction,
  InventoryItem,
  GoogleSheetsConfig,
  SyncState,
  SupabaseConfig,
  StudioUser,
} from './types';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  loadAllFromSupabase,
  syncAllToSupabase,
  subscribeToSupabaseChanges,
  supabaseGetSession,
  onSupabaseAuthStateChange,
  supabaseSignOut,
} from './services/supabaseClient';
import {
  loadStoredBookings,
  saveStoredBookings,
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredInventory,
  saveStoredInventory,
  loadSheetsConfig,
  saveSheetsConfig,
} from './services/localStorageBackup';
import {
  createDatabaseSpreadsheet,
  syncAllToGoogleSheets,
  loadAllFromGoogleSheets,
} from './services/sheetsService';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { BookingModule } from './components/BookingModule';
import { CashierModule } from './components/CashierModule';
import { InventoryModule } from './components/InventoryModule';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AppsScriptGuideModal } from './components/AppsScriptGuideModal';
import { SupabaseModal } from './components/SupabaseModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'cashier' | 'inventory'>('dashboard');

  // Application Data States (Permanently initialized from localStorage)
  const [bookings, setBookings] = useState<Booking[]>(() => loadStoredBookings());
  const [transactions, setTransactions] = useState<CashierTransaction[]>(() => loadStoredTransactions());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStoredInventory());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => loadSheetsConfig());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());

  // User & Sync States
  const [user, setUser] = useState<StudioUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: supabaseConfig.isConnected ? 'Supabase Tersambung' : 'Data tersimpan lokal',
  });

  // Modal States
  const [receiptTrx, setReceiptTrx] = useState<CashierTransaction | null>(null);
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  // Destructive Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Debounce ref for auto-syncing
  const syncTimeoutRef = useRef<any>(null);

  // -------------------------------------------------------------
  // Supabase Real-Time Sync Helper
  // -------------------------------------------------------------
  const triggerSupabaseSync = useCallback(
    async (
      currentBookings: Booking[],
      currentTransactions: CashierTransaction[],
      currentInventory: InventoryItem[]
    ) => {
      const config = getStoredSupabaseConfig();
      if (!config.isConnected || !config.url || !config.anonKey) {
        return;
      }

      setSyncState((prev) => ({
        ...prev,
        status: 'syncing',
        message: 'Menyinkronkan ke Supabase Cloud...',
      }));

      try {
        await syncAllToSupabase(currentBookings, currentTransactions, currentInventory);

        const updatedConfig = {
          ...config,
          lastSyncedAt: new Date().toISOString(),
        };
        setSupabaseConfig(updatedConfig);
        saveStoredSupabaseConfig(updatedConfig);

        setSyncState({
          status: 'synced',
          message: 'Tersinkronisasi ke Supabase',
          lastSyncTime: new Date(),
        });
      } catch (err: any) {
        console.error('Supabase sync error:', err);
        setSyncState({
          status: 'error',
          message: `Gagal sinkron Supabase: ${err.message || 'Periksa koneksi'}`,
        });
      }
    },
    []
  );

  // Unified trigger for both Supabase & secondary Sheets
  const triggerAutoSync = useCallback(
    (
      currentBookings: Booking[],
      currentTransactions: CashierTransaction[],
      currentInventory: InventoryItem[]
    ) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        triggerSupabaseSync(currentBookings, currentTransactions, currentInventory);
      }, 600);
    },
    [triggerSupabaseSync]
  );

  // Initial Auth & Supabase Data Pull
  useEffect(() => {
    // 1. Check current Supabase Auth session
    supabaseGetSession().then(({ user: authUser }) => {
      setUser(authUser);
    });

    // 2. Listen to Supabase Auth state changes
    const unsubAuth = onSupabaseAuthStateChange((authUser) => {
      setUser(authUser);
    });

    // 3. If Supabase is configured, pull latest remote records
    const config = getStoredSupabaseConfig();
    if (config.isConnected && config.url && config.anonKey) {
      setSyncState({
        status: 'syncing',
        message: 'Memuat data dari Supabase...',
      });
      loadAllFromSupabase()
        .then((remote) => {
          if (remote.bookings.length > 0) {
            setBookings(remote.bookings);
            saveStoredBookings(remote.bookings);
          }
          if (remote.transactions.length > 0) {
            setTransactions(remote.transactions);
            saveStoredTransactions(remote.transactions);
          }
          if (remote.inventory.length > 0) {
            setInventory(remote.inventory);
            saveStoredInventory(remote.inventory);
          }
          setSyncState({
            status: 'synced',
            message: 'Tersambung ke Supabase Realtime',
            lastSyncTime: new Date(),
          });
        })
        .catch((e) => {
          console.warn('Initial Supabase load fallback to local:', e);
          setSyncState({
            status: 'idle',
            message: 'Menggunakan data lokal',
          });
        });
    }

    // 4. Setup Realtime subscription
    const unsubRealtime = subscribeToSupabaseChanges(() => {
      loadAllFromSupabase()
        .then((remote) => {
          if (remote.bookings.length > 0) setBookings(remote.bookings);
          if (remote.transactions.length > 0) setTransactions(remote.transactions);
          if (remote.inventory.length > 0) setInventory(remote.inventory);
          setSyncState({
            status: 'synced',
            message: 'Data terupdate real-time',
            lastSyncTime: new Date(),
          });
        })
        .catch((err) => console.warn('Realtime fetch error:', err));
    });

    return () => {
      unsubAuth();
      unsubRealtime();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabaseSignOut();
    setUser(null);
    setSyncState({
      status: 'disconnected',
      message: 'Akun terputus',
    });
  };

  // Manual Sync button
  const handleManualSync = async () => {
    await triggerSupabaseSync(bookings, transactions, inventory);
  };

  // Create new Spreadsheet (optional secondary backup)
  const handleCreateNewSpreadsheet = async () => {
    setIsAppsScriptOpen(true);
  };

  // -------------------------------------------------------------
  // Booking Handlers
  // -------------------------------------------------------------
  const handleAddBooking = (newBooking: Booking) => {
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveStoredBookings(updated);

    // Auto-create DP transaction in cashier if DP was provided
    if (newBooking.downPayment > 0) {
      const nowStr = new Date().toISOString();
      const datePart = nowStr.slice(0, 10).replace(/-/g, '');
      const dpTrx: CashierTransaction = {
        id: `TRX-${datePart}-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: 'MASUK',
        category: 'Uang Muka / DP',
        description: `DP Booking ${newBooking.serviceName} (${newBooking.customerName})`,
        amount: newBooking.downPayment,
        paymentMethod: 'Transfer Bank',
        customerOrReference: `${newBooking.customerName} (${newBooking.id})`,
        createdAt: nowStr,
      };
      const updatedTrx = [dpTrx, ...transactions];
      setTransactions(updatedTrx);
      saveStoredTransactions(updatedTrx);
      triggerAutoSync(updated, updatedTrx, inventory);
      return;
    }

    triggerAutoSync(updated, transactions, inventory);
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    saveStoredBookings(updated);
    triggerAutoSync(updated, transactions, inventory);
  };

  const handleDeleteBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    setConfirmationModal({
      isOpen: true,
      title: 'Hapus Jadwal Booking?',
      message: `Apakah Anda yakin ingin menghapus jadwal booking untuk "${target?.customerName || bookingId}"?\nData yang dihapus akan otomatis disinkronkan ke Supabase.`,
      action: () => {
        const updated = bookings.filter((b) => b.id !== bookingId);
        setBookings(updated);
        saveStoredBookings(updated);
        triggerAutoSync(updated, transactions, inventory);
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Fast payment of remaining booking from Cashier
  const handleRequestCashierPayment = (_booking: Booking) => {
    setActiveTab('cashier');
  };

  // -------------------------------------------------------------
  // Cashier Handlers
  // -------------------------------------------------------------
  const handleAddTransaction = (newTrx: CashierTransaction) => {
    const updated = [newTrx, ...transactions];
    setTransactions(updated);
    saveStoredTransactions(updated);
    triggerAutoSync(bookings, updated, inventory);
  };

  const handleUpdateTransaction = (updatedTrx: CashierTransaction) => {
    const updated = transactions.map((t) => (t.id === updatedTrx.id ? updatedTrx : t));
    setTransactions(updated);
    saveStoredTransactions(updated);
    triggerAutoSync(bookings, updated, inventory);
  };

  const handleDeleteTransaction = (trxId: string) => {
    const target = transactions.find((t) => t.id === trxId);
    setConfirmationModal({
      isOpen: true,
      title: 'Hapus Transaksi Kasir?',
      message: `Apakah Anda yakin ingin menghapus transaksi "${target?.id} - ${target?.description}" sebesar Rp ${target?.amount.toLocaleString('id-ID')}?\nTindakan ini akan mempengaruhi rekap kas dan disinkronkan ke Supabase.`,
      action: () => {
        const updated = transactions.filter((t) => t.id !== trxId);
        setTransactions(updated);
        saveStoredTransactions(updated);
        triggerAutoSync(bookings, updated, inventory);
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // -------------------------------------------------------------
  // Inventory Handlers
  // -------------------------------------------------------------
  const handleAddItem = (newItem: InventoryItem) => {
    const updated = [...inventory, newItem];
    setInventory(updated);
    saveStoredInventory(updated);
    triggerAutoSync(bookings, transactions, updated);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    const updated = inventory.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    setInventory(updated);
    saveStoredInventory(updated);
    triggerAutoSync(bookings, transactions, updated);
  };

  const handleDeleteItem = (itemId: string) => {
    const target = inventory.find((i) => i.id === itemId);
    setConfirmationModal({
      isOpen: true,
      title: 'Hapus Item Inventaris?',
      message: `Apakah Anda yakin ingin menghapus data inventaris "${target?.name} (${target?.sku})"?`,
      action: () => {
        const updated = inventory.filter((i) => i.id !== itemId);
        setInventory(updated);
        saveStoredInventory(updated);
        triggerAutoSync(bookings, transactions, updated);
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleQuickAdjustQuantity = (itemId: string, delta: number) => {
    const updated = inventory.map((i) => {
      if (i.id === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        const newStatus = newQty === 0 ? 'Habis' : i.status === 'Habis' ? 'Tersedia' : i.status;
        return {
          ...i,
          quantity: newQty,
          status: newStatus as any,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });
    setInventory(updated);
    saveStoredInventory(updated);
    triggerAutoSync(bookings, transactions, updated);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-[#0D8A5B] selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        syncState={syncState}
        supabaseConfig={supabaseConfig}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onLogout={handleLogout}
        onManualSync={handleManualSync}
        onOpenAppsScriptGuide={() => setIsAppsScriptOpen(true)}
        sheetsConfig={sheetsConfig}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            bookings={bookings}
            transactions={transactions}
            inventory={inventory}
            sheetsConfig={sheetsConfig}
            syncState={syncState}
            supabaseConfig={supabaseConfig}
            onNavigateTab={setActiveTab}
            onViewReceipt={(trx) => setReceiptTrx(trx)}
            onManualSync={handleManualSync}
            onOpenAppsScriptGuide={() => setIsAppsScriptOpen(true)}
            onCreateNewSheet={handleCreateNewSpreadsheet}
            onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
            isLoggedIn={!!user}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingModule
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onRequestCashierPayment={handleRequestCashierPayment}
          />
        )}

        {activeTab === 'cashier' && (
          <CashierModule
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onViewReceipt={(trx) => setReceiptTrx(trx)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule
            inventory={inventory}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onQuickAdjustQuantity={handleQuickAdjustQuantity}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white border-t border-slate-200 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              <span className="text-[#0D8A5B]">n</span>
              <span className="text-[#F59E0B]">U</span>
              <span className="text-[#0D8A5B]">BA</span> PHOTO STUDIO
            </span>
            <span>• Database Utama Supabase PostgreSQL Real-Time &amp; Drive Assets</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseOpen(true)}
              className="text-[#0D8A5B] hover:text-[#09734a] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Pengaturan Supabase</span>
            </button>
            <button
              onClick={() => setIsAppsScriptOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-semibold hover:underline cursor-pointer"
            >
              Google Apps Script
            </button>
          </div>
        </div>
      </footer>

      {/* Destructive Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.action}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        transaction={receiptTrx}
        onClose={() => setReceiptTrx(null)}
        brandName="NUBA PHOTO STUDIO"
      />

      {/* Supabase Integration & Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        supabaseConfig={supabaseConfig}
        onConfigUpdated={(newConfig) => {
          setSupabaseConfig(newConfig);
          setSyncState({
            status: 'synced',
            message: 'Supabase Terhubung',
            lastSyncTime: new Date(),
          });
        }}
        user={user}
        onUserChanged={(u) => setUser(u)}
        onTriggerSync={() => triggerSupabaseSync(bookings, transactions, inventory)}
      />

      {/* Apps Script Guide Modal */}
      <AppsScriptGuideModal
        isOpen={isAppsScriptOpen}
        onClose={() => setIsAppsScriptOpen(false)}
        spreadsheetId={sheetsConfig.spreadsheetId}
        spreadsheetUrl={sheetsConfig.spreadsheetUrl}
        appScriptUrl={sheetsConfig.appScriptUrl || ''}
        onSaveAppScriptUrl={(url) => {
          const updated = { ...sheetsConfig, appScriptUrl: url };
          setSheetsConfig(updated);
          saveSheetsConfig(updated);
        }}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
