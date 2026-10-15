import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Booking, CashierTransaction, InventoryItem, SupabaseConfig, StudioUser } from '../types';

const STORAGE_KEY_CONFIG = 'nuba_supabase_config_v1';

// Default / fallback configurations pre-configured for Nuba Photo Studio
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exhntobbjevaabxvybqq.supabase.co';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aG50b2JiamV2YWFieHlieXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg0MDUsImV4cCI6MjA4NjA1NDQwNX0.abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJK';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || defaultUrl,
        anonKey: parsed.anonKey || defaultKey,
        isConnected: true, // Always connected by default
        lastSyncedAt: parsed.lastSyncedAt || null,
      };
    }
  } catch (e) {
    console.warn('Failed to parse Supabase config from localStorage', e);
  }
  return {
    url: defaultUrl,
    anonKey: defaultKey,
    isConnected: true, // Always connected by default
    lastSyncedAt: null,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save Supabase config to localStorage', e);
  }
}

// Global active client singleton
let activeSupabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (activeSupabaseClient) return activeSupabaseClient;

  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      activeSupabaseClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return activeSupabaseClient;
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function reinitSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  try {
    if (!url || !anonKey) {
      activeSupabaseClient = null;
      return null;
    }
    activeSupabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return activeSupabaseClient;
  } catch (e) {
    console.error('Error re-initializing Supabase client:', e);
    return null;
  }
}

/**
 * Test connectivity with Supabase by checking auth/endpoint health
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, anonKey);
    // Ping auth or table
    const { error } = await tempClient.from('bookings').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "bookings" does not exist')) {
      // If table doesn't exist yet, connection is still valid, only schema needed
      if (error.message.includes('relation') || error.code === '42P01') {
        return { success: true, message: 'Terhubung ke Supabase! (Tabel belum dibuat, klik tombol Buat Skema SQL).' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Berhasil terhubung ke Supabase Database & Realtime!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menyambung ke Supabase' };
  }
}

// ==============================================================================
// AUTHENTICATION WITH SUPABASE
// ==============================================================================

export async function supabaseGetSession(): Promise<{ user: StudioUser | null; session: Session | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, session: null };

  const { data } = await client.auth.getSession();
  if (data?.session?.user) {
    const u = data.session.user;
    return {
      session: data.session,
      user: {
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User Studio',
        avatarUrl: u.user_metadata?.avatar_url || '',
      },
    };
  }
  return { user: null, session: null };
}

export function onSupabaseAuthStateChange(callback: (user: StudioUser | null) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const u = session.user;
      callback({
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User Studio',
        avatarUrl: u.user_metadata?.avatar_url || '',
      });
    } else {
      callback(null);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
}

export async function supabaseSignInWithEmail(email: string, password: string): Promise<StudioUser> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client belum dikonfigurasi. Masukkan URL & Anon Key terlebih dahulu.');

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Pengguna tidak ditemukan.');

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
    avatarUrl: data.user.user_metadata?.avatar_url,
  };
}

export async function supabaseSignUpWithEmail(email: string, password: string, name?: string): Promise<StudioUser> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client belum dikonfigurasi.');

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || email.split('@')[0],
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Pendaftaran gagal.');

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: name || data.user.email?.split('@')[0],
  };
}

export async function supabaseSignInWithOAuth(provider: 'google' | 'github') {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client belum dikonfigurasi.');

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
}

// ==============================================================================
// DATABASE QUERIES & REAL-TIME SYNC WITH SUPABASE POSTGRESQL
// ==============================================================================

/**
 * Loads all state from Supabase tables
 */
export async function loadAllFromSupabase(): Promise<{
  bookings: Booking[];
  transactions: CashierTransaction[];
  inventory: InventoryItem[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung.');
  }

  // 1. Fetch Bookings
  const { data: rawBookings, error: bErr } = await client
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (
    bErr &&
    bErr.code !== 'PGRST205' &&
    bErr.code !== '42P01' &&
    !bErr.message?.includes('does not exist') &&
    !bErr.message?.includes('Could not find the table')
  ) {
    console.error('Error loading bookings from Supabase:', bErr);
  }

  // 2. Fetch Transactions
  const { data: rawTrx, error: tErr } = await client
    .from('cashier_transactions')
    .select('*')
    .order('date', { ascending: false });

  if (
    tErr &&
    tErr.code !== 'PGRST205' &&
    tErr.code !== '42P01' &&
    !tErr.message?.includes('does not exist') &&
    !tErr.message?.includes('Could not find the table')
  ) {
    console.error('Error loading transactions from Supabase:', tErr);
  }

  // 3. Fetch Inventory
  const { data: rawInv, error: iErr } = await client
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });

  if (
    iErr &&
    iErr.code !== 'PGRST205' &&
    iErr.code !== '42P01' &&
    !iErr.message?.includes('does not exist') &&
    !iErr.message?.includes('Could not find the table')
  ) {
    console.error('Error loading inventory from Supabase:', iErr);
  }

  const bookings: Booking[] = (rawBookings || []).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name || '',
    phone: row.phone || '',
    serviceName: row.service_name || '',
    date: row.date || '',
    startTime: row.start_time || '09:00',
    endTime: row.end_time || '10:00',
    status: row.status || 'Dikonfirmasi',
    totalPrice: Number(row.total_price) || 0,
    downPayment: Number(row.down_payment) || 0,
    remainingPayment: Number(row.remaining_payment) || 0,
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  }));

  const transactions: CashierTransaction[] = (rawTrx || []).map((row: any) => ({
    id: row.id,
    date: row.date || '',
    type: row.type === 'KELUAR' ? 'KELUAR' : 'MASUK',
    category: row.category || 'Umum',
    description: row.description || '',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'Tunai',
    customerOrReference: row.customer_reference || '',
    receiptUrl: row.receipt_url || '',
    createdAt: row.created_at || new Date().toISOString(),
  }));

  const inventory: InventoryItem[] = (rawInv || []).map((row: any) => ({
    id: row.id,
    name: row.name || '',
    sku: row.sku || '',
    category: row.category || 'Umum',
    quantity: Number(row.quantity) || 0,
    unit: row.unit || 'Unit',
    costPrice: Number(row.cost_price) || 0,
    status: row.status || 'Tersedia',
    location: row.location || '',
    driveFileUrl: row.drive_file_url || '',
    notes: row.notes || '',
    updatedAt: row.updated_at || new Date().toISOString(),
  }));

  return { bookings, transactions, inventory };
}

/**
 * Saves all records to Supabase tables
 */
export async function syncAllToSupabase(
  bookings: Booking[],
  transactions: CashierTransaction[],
  inventory: InventoryItem[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung.');
  }

  // Format Bookings
  const bookingRows = bookings.map((b) => ({
    id: b.id,
    customer_name: b.customerName,
    phone: b.phone,
    service_name: b.serviceName,
    date: b.date,
    start_time: b.startTime,
    end_time: b.endTime,
    status: b.status,
    total_price: b.totalPrice,
    down_payment: b.downPayment,
    remaining_payment: b.remainingPayment,
    notes: b.notes || null,
    created_at: b.createdAt,
  }));

  // Format Transactions
  const trxRows = transactions.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: t.amount,
    payment_method: t.paymentMethod,
    customer_reference: t.customerOrReference || null,
    receipt_url: t.receiptUrl || null,
    created_at: t.createdAt,
  }));

  // Format Inventory
  const invRows = inventory.map((i) => ({
    id: i.id,
    name: i.name,
    sku: i.sku,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    cost_price: i.costPrice,
    status: i.status,
    location: i.location || null,
    drive_file_url: i.driveFileUrl || null,
    notes: i.notes || null,
    updated_at: i.updatedAt,
  }));

  // Perform Upserts
  if (bookingRows.length > 0) {
    const { error } = await client.from('bookings').upsert(bookingRows, { onConflict: 'id' });
    if (error) throw new Error(`Gagal menyimpan booking ke Supabase: ${error.message}`);
  }

  if (trxRows.length > 0) {
    const { error } = await client.from('cashier_transactions').upsert(trxRows, { onConflict: 'id' });
    if (error) throw new Error(`Gagal menyimpan transaksi ke Supabase: ${error.message}`);
  }

  if (invRows.length > 0) {
    const { error } = await client.from('inventory_items').upsert(invRows, { onConflict: 'id' });
    if (error) throw new Error(`Gagal menyimpan inventaris ke Supabase: ${error.message}`);
  }
}

/**
 * Setup Realtime Listeners for Supabase
 */
export function subscribeToSupabaseChanges(onDataChange: () => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
      onDataChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cashier_transactions' }, () => {
      onDataChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
      onDataChange();
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Ready-to-copy SQL Schema for Supabase SQL Editor
 */
export function generateSupabaseSqlSchema(): string {
  return `-- ==============================================================================
-- NUBA PHOTO STUDIO: SUPABASE POSTGRESQL DATABASE SCHEMA
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABEL JADWAL BOOKING & PELANGGAN
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '10:00',
    status TEXT NOT NULL DEFAULT 'Dikonfirmasi',
    total_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    down_payment NUMERIC(14, 2) NOT NULL DEFAULT 0,
    remaining_payment NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KASIR & REKAP KEUANGAN
CREATE TABLE IF NOT EXISTS public.cashier_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MASUK', 'KELUAR')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Tunai',
    customer_reference TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL INVENTARIS & FILE ASET STUDIO
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Unit',
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Tersedia',
    location TEXT,
    drive_file_url TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Izinkan akses penuh untuk anon & authenticated users
DROP POLICY IF EXISTS "Akses Publik Bookings" ON public.bookings;
CREATE POLICY "Akses Publik Bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Kasir" ON public.cashier_transactions;
CREATE POLICY "Akses Publik Kasir" ON public.cashier_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Publik Inventaris" ON public.inventory_items;
CREATE POLICY "Akses Publik Inventaris" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

-- 5. AKTIFKAN SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashier_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;

-- SELESAI! Database Supabase siap digunakan secara real-time.
`;
}
