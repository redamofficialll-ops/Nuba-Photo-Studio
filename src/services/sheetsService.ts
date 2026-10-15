import { Booking, CashierTransaction, InventoryItem, GoogleSheetsConfig } from '../types';

const SHEET_NAMES = {
  BOOKINGS: 'Jadwal_Booking',
  TRANSACTIONS: 'Kasir_Keuangan',
  INVENTORY: 'Inventaris_File',
};

const HEADERS = {
  BOOKINGS: [
    'ID Booking',
    'Nama Pelanggan',
    'No WhatsApp',
    'Layanan / Paket',
    'Tanggal (YYYY-MM-DD)',
    'Jam Mulai',
    'Jam Selesai',
    'Status',
    'Total Biaya (Rp)',
    'DP / Uang Muka (Rp)',
    'Sisa Tagihan (Rp)',
    'Catatan',
    'Tanggal Dibuat',
  ],
  TRANSACTIONS: [
    'ID Transaksi',
    'Tanggal & Waktu',
    'Tipe (MASUK/KELUAR)',
    'Kategori',
    'Keterangan',
    'Nominal (Rp)',
    'Metode Pembayaran',
    'Referensi / Klien',
    'Link Bukti / File',
    'Dibuat Pada',
  ],
  INVENTORY: [
    'ID Item',
    'Kode SKU',
    'Nama Barang / Dokumen',
    'Kategori',
    'Jumlah Stok',
    'Satuan',
    'Nilai Satuan (Rp)',
    'Status',
    'Lokasi Penyimpanan',
    'Link Google Drive / Dokumen',
    'Catatan Tambahan',
    'Terakhir Diperbarui',
  ],
};

/**
 * Creates a brand new Google Spreadsheet configured with our 3 database tabs
 */
export async function createDatabaseSpreadsheet(
  accessToken: string,
  title = '[Database] Manajemen Booking, Kasir & Inventaris'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const requestBody = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: SHEET_NAMES.BOOKINGS,
          gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.TRANSACTIONS,
          gridProperties: { rowCount: 2000, columnCount: 15, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: SHEET_NAMES.INVENTORY,
          gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membuat spreadsheet di Google Sheets: ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Headers
  await setupHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Initializes header rows for all 3 sheets
 */
export async function setupHeaders(accessToken: string, spreadsheetId: string) {
  const valueRanges = [
    {
      range: `${SHEET_NAMES.BOOKINGS}!A1:M1`,
      values: [HEADERS.BOOKINGS],
    },
    {
      range: `${SHEET_NAMES.TRANSACTIONS}!A1:J1`,
      values: [HEADERS.TRANSACTIONS],
    },
    {
      range: `${SHEET_NAMES.INVENTORY}!A1:L1`,
      values: [HEADERS.INVENTORY],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    }),
  });
}

/**
 * Checks if spreadsheet has the expected sheets, creating them if missing
 */
export async function ensureSheetTabsExist(accessToken: string, spreadsheetId: string) {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    throw new Error('Spreadsheet tidak ditemukan atau Anda tidak memiliki akses izin.');
  }

  const metaData = await metaRes.json();
  const existingSheets = (metaData.sheets || []).map((s: any) => s.properties?.title);

  const neededSheets = [SHEET_NAMES.BOOKINGS, SHEET_NAMES.TRANSACTIONS, SHEET_NAMES.INVENTORY];
  const missingSheets = neededSheets.filter((name) => !existingSheets.includes(name));

  if (missingSheets.length > 0) {
    const requests = missingSheets.map((sheetTitle) => ({
      addSheet: {
        properties: {
          title: sheetTitle,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    await setupHeaders(accessToken, spreadsheetId);
  }
}

/**
 * Synchronizes all state from app to Google Sheets
 */
export async function syncAllToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  bookings: Booking[],
  transactions: CashierTransaction[],
  inventory: InventoryItem[]
): Promise<void> {
  await ensureSheetTabsExist(accessToken, spreadsheetId);

  // 1. Prepare Bookings Matrix
  const bookingRows = [
    HEADERS.BOOKINGS,
    ...bookings.map((b) => [
      b.id,
      b.customerName,
      b.phone,
      b.serviceName,
      b.date,
      b.startTime,
      b.endTime,
      b.status,
      b.totalPrice,
      b.downPayment,
      b.remainingPayment,
      b.notes || '',
      b.createdAt,
    ]),
  ];

  // 2. Prepare Transactions Matrix
  const transactionRows = [
    HEADERS.TRANSACTIONS,
    ...transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.category,
      t.description,
      t.amount,
      t.paymentMethod,
      t.customerOrReference || '',
      t.receiptUrl || '',
      t.createdAt,
    ]),
  ];

  // 3. Prepare Inventory Matrix
  const inventoryRows = [
    HEADERS.INVENTORY,
    ...inventory.map((inv) => [
      inv.id,
      inv.sku,
      inv.name,
      inv.category,
      inv.quantity,
      inv.unit,
      inv.costPrice,
      inv.status,
      inv.location,
      inv.driveFileUrl || '',
      inv.notes || '',
      inv.updatedAt,
    ]),
  ];

  // Clear existing content to avoid stale rows
  await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAMES.BOOKINGS}!A1:Z1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAMES.TRANSACTIONS}!A1:Z2000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAMES.INVENTORY}!A1:Z1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  // Batch update with current clean records
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_NAMES.BOOKINGS}!A1`,
          values: bookingRows,
        },
        {
          range: `${SHEET_NAMES.TRANSACTIONS}!A1`,
          values: transactionRows,
        },
        {
          range: `${SHEET_NAMES.INVENTORY}!A1`,
          values: inventoryRows,
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Gagal menyimpan data ke Google Sheets: ${errorText}`);
  }
}

/**
 * Loads all data from Google Sheets into the application
 */
export async function loadAllFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  bookings: Booking[];
  transactions: CashierTransaction[];
  inventory: InventoryItem[];
}> {
  await ensureSheetTabsExist(accessToken, spreadsheetId);

  const ranges = [
    `${SHEET_NAMES.BOOKINGS}!A2:M`,
    `${SHEET_NAMES.TRANSACTIONS}!A2:J`,
    `${SHEET_NAMES.INVENTORY}!A2:L`,
  ];

  const queryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join('&')}`;

  const res = await fetch(queryUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membaca data dari Google Sheets: ${errorText}`);
  }

  const result = await res.json();
  const valueRanges = result.valueRanges || [];

  const rawBookings: any[][] = valueRanges[0]?.values || [];
  const rawTransactions: any[][] = valueRanges[1]?.values || [];
  const rawInventory: any[][] = valueRanges[2]?.values || [];

  // Parse Bookings
  const bookings: Booking[] = rawBookings
    .filter((row) => row && row[0])
    .map((row) => ({
      id: String(row[0] || ''),
      customerName: String(row[1] || ''),
      phone: String(row[2] || ''),
      serviceName: String(row[3] || ''),
      date: String(row[4] || ''),
      startTime: String(row[5] || '09:00'),
      endTime: String(row[6] || '10:00'),
      status: (row[7] as any) || 'Menunggu Konfirmasi',
      totalPrice: Number(String(row[8] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      downPayment: Number(String(row[9] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      remainingPayment: Number(String(row[10] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      notes: String(row[11] || ''),
      createdAt: String(row[12] || new Date().toISOString()),
    }));

  // Parse Transactions
  const transactions: CashierTransaction[] = rawTransactions
    .filter((row) => row && row[0])
    .map((row) => ({
      id: String(row[0] || ''),
      date: String(row[1] || ''),
      type: (row[2] === 'KELUAR' ? 'KELUAR' : 'MASUK') as any,
      category: String(row[3] || 'Lainnya'),
      description: String(row[4] || ''),
      amount: Number(String(row[5] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      paymentMethod: (row[6] as any) || 'Tunai',
      customerOrReference: String(row[7] || ''),
      receiptUrl: String(row[8] || ''),
      createdAt: String(row[9] || new Date().toISOString()),
    }));

  // Parse Inventory
  const inventory: InventoryItem[] = rawInventory
    .filter((row) => row && row[0])
    .map((row) => ({
      id: String(row[0] || ''),
      sku: String(row[1] || ''),
      name: String(row[2] || ''),
      category: String(row[3] || 'Umum'),
      quantity: Number(String(row[4] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      unit: String(row[5] || 'Unit'),
      costPrice: Number(String(row[6] || 0).replace(/[^0-9.-]+/g, '')) || 0,
      status: (row[7] as any) || 'Tersedia',
      location: String(row[8] || ''),
      driveFileUrl: String(row[9] || ''),
      notes: String(row[10] || ''),
      updatedAt: String(row[11] || new Date().toISOString()),
    }));

  return { bookings, transactions, inventory };
}

/**
 * Generates ready-to-copy Google Apps Script (.gs) source code
 */
export function generateAppsScriptCode(spreadsheetId: string): string {
  return `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: SISTEM MANAJEMEN BOOKING, KASIR & INVENTARIS
 * Database Utama Google Sheets Real-Time
 * Spreadsheet ID: ${spreadsheetId || 'AKTIF_SPREADSHEET'}
 * ==============================================================================
 */

// 1. Menu Tambahan Otomatis di Google Sheets
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Menu Sistem Studio')
    .addItem('📊 Ringkasan Kas Harian', 'tampilkanRekapKasHarian')
    .addItem('📅 Cek Jadwal Hari Ini', 'cekJadwalHariIni')
    .addItem('📦 Cek Stok Menipis', 'cekStokMenipis')
    .addSeparator()
    .addItem('⚙️ Format Ulang Tabel & Header', 'inisialisasiTabelHeader')
    .addToUi();
}

// 2. Web App Webhook Endpoint (doGet & doPost)
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {
    status: 'success',
    spreadsheetTitle: ss.getName(),
    sheets: ss.getSheets().map(s => s.getName()),
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = data.action;

    if (action === 'sync_all') {
      // Simpan batch booking
      if (data.bookings) {
        simpanSheetData(ss.getSheetByName('Jadwal_Booking'), data.bookings);
      }
      // Simpan kasir
      if (data.transactions) {
        simpanSheetData(ss.getSheetByName('Kasir_Keuangan'), data.transactions);
      }
      // Simpan inventaris
      if (data.inventory) {
        simpanSheetData(ss.getSheetByName('Inventaris_File'), data.inventory);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data berhasil disinkronkan via AppsScript!' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aksi tidak dikenali' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. Format Ulang Header & Sheet jika dibutuhkan
function inisialisasiTabelHeader() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tab Booking
  let sBooking = ss.getSheetByName('Jadwal_Booking');
  if (!sBooking) sBooking = ss.insertSheet('Jadwal_Booking');
  sBooking.getRange(1, 1, 1, 13).setValues([[
    'ID Booking', 'Nama Pelanggan', 'No WhatsApp', 'Layanan / Paket', 
    'Tanggal (YYYY-MM-DD)', 'Jam Mulai', 'Jam Selesai', 'Status', 
    'Total Biaya (Rp)', 'DP / Uang Muka (Rp)', 'Sisa Tagihan (Rp)', 'Catatan', 'Tanggal Dibuat'
  ]]).setBackground('#2563EB').setFontColor('#FFFFFF').setFontWeight('bold');
  sBooking.setFrozenRows(1);

  // Tab Kasir
  let sKasir = ss.getSheetByName('Kasir_Keuangan');
  if (!sKasir) sKasir = ss.insertSheet('Kasir_Keuangan');
  sKasir.getRange(1, 1, 1, 10).setValues([[
    'ID Transaksi', 'Tanggal & Waktu', 'Tipe (MASUK/KELUAR)', 'Kategori', 
    'Keterangan', 'Nominal (Rp)', 'Metode Pembayaran', 'Referensi / Klien', 'Link Bukti / File', 'Dibuat Pada'
  ]]).setBackground('#059669').setFontColor('#FFFFFF').setFontWeight('bold');
  sKasir.setFrozenRows(1);

  // Tab Inventaris
  let sInv = ss.getSheetByName('Inventaris_File');
  if (!sInv) sInv = ss.insertSheet('Inventaris_File');
  sInv.getRange(1, 1, 1, 12).setValues([[
    'ID Item', 'Kode SKU', 'Nama Barang / Dokumen', 'Kategori', 
    'Jumlah Stok', 'Satuan', 'Nilai Satuan (Rp)', 'Status', 
    'Lokasi Penyimpanan', 'Link Google Drive / Dokumen', 'Catatan Tambahan', 'Terakhir Diperbarui'
  ]]).setBackground('#7C3AED').setFontColor('#FFFFFF').setFontWeight('bold');
  sInv.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ Berhasil menginisialisasi Header tabel Database!');
}

// 4. Dialog Rekap Kas Harian Langsung di Spreadsheet
function tampilkanRekapKasHarian() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sKasir = ss.getSheetByName('Kasir_Keuangan');
  if (!sKasir) return;

  const data = sKasir.getDataRange().getValues();
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (let i = 1; i < data.length; i++) {
    const tipe = data[i][2];
    const nominal = Number(data[i][5]) || 0;
    if (tipe === 'MASUK') totalMasuk += nominal;
    if (tipe === 'KELUAR') totalKeluar += nominal;
  }

  const saldo = totalMasuk - totalKeluar;
  const pesan = '📊 REKAP KASIR KEUANGAN:\\n\\n' +
    'Total Kas Masuk : Rp ' + totalMasuk.toLocaleString('id-ID') + '\\n' +
    'Total Kas Keluar : Rp ' + totalKeluar.toLocaleString('id-ID') + '\\n' +
    '--------------------------------------\\n' +
    'Laba / Sisa Saldo: Rp ' + saldo.toLocaleString('id-ID');

  SpreadsheetApp.getUi().alert(pesan);
}

// 5. Cek Jadwal Hari Ini
function cekJadwalHariIni() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sBooking = ss.getSheetByName('Jadwal_Booking');
  if (!sBooking) return;

  const todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  const data = sBooking.getDataRange().getValues();
  let count = 0;
  let daftar = '';

  for (let i = 1; i < data.length; i++) {
    const tgl = String(data[i][4]);
    if (tgl.indexOf(todayStr) !== -1 || tgl === todayStr) {
      count++;
      daftar += count + '. ' + data[i][1] + ' (' + data[i][5] + ' - ' + data[i][6] + ') - ' + data[i][3] + ' [' + data[i][7] + ']\\n';
    }
  }

  const pesan = '📅 JADWAL BOOKING HARI INI (' + todayStr + '): ' + count + ' Sesi\\n\\n' + (daftar || 'Tidak ada booking hari ini.');
  SpreadsheetApp.getUi().alert(pesan);
}

// 6. Cek Stok Inventaris Menipis (< 3 unit)
function cekStokMenipis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sInv = ss.getSheetByName('Inventaris_File');
  if (!sInv) return;

  const data = sInv.getDataRange().getValues();
  let list = '';
  for (let i = 1; i < data.length; i++) {
    const nama = data[i][2];
    const qty = Number(data[i][4]) || 0;
    const unit = data[i][5];
    if (qty <= 2) {
      list += '⚠️ ' + nama + ' : Sisa ' + qty + ' ' + unit + '\\n';
    }
  }
  SpreadsheetApp.getUi().alert('📦 PERINGATAN STOK MENIPIS:\\n\\n' + (list || 'Semua stok dalam batas aman!'));
}

function simpanSheetData(sheet, dataRows) {
  if (!sheet || !dataRows || dataRows.length === 0) return;
  sheet.getRange(2, 1, sheet.getLastRow() > 1 ? sheet.getLastRow() - 1 : 1, sheet.getLastColumn()).clearContent();
  sheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
}
`;
}
