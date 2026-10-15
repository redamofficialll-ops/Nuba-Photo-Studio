import React from 'react';
import { Printer, X, ReceiptText } from 'lucide-react';
import { CashierTransaction } from '../types';
import { NubaLogo } from './NubaLogo';

interface ReceiptModalProps {
  transaction: CashierTransaction | null;
  onClose: () => void;
  brandName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  brandName = 'NUBA PHOTO STUDIO',
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(transaction.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <ReceiptText className="w-4 h-4 text-[#0D8A5B]" />
            <span>Bukti Struk Transaksi</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal / Paper Receipt Body */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-800 space-y-4 font-mono text-xs">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-1">
              <NubaLogo size="sm" />
            </div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide">
              Official Payment Receipt • Database Google Sheets
            </p>
          </div>

          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>No. Transaksi</span>
              <span className="font-bold text-slate-900">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu</span>
              <span>{transaction.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipe Kas</span>
              <span
                className={`font-semibold ${
                  transaction.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {transaction.type === 'MASUK' ? 'Pemasukan (Kredit)' : 'Pengeluaran (Debit)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kategori</span>
              <span>{transaction.category}</span>
            </div>
            {transaction.customerOrReference && (
              <div className="flex justify-between">
                <span>Pelanggan/Ref</span>
                <span className="font-medium text-slate-800 text-right max-w-[170px] truncate">
                  {transaction.customerOrReference}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Metode Bayar</span>
              <span className="font-bold text-slate-800">{transaction.paymentMethod}</span>
            </div>
          </div>

          <div className="py-2 border-t border-b border-dashed border-slate-300">
            <div className="text-slate-500 mb-1">Rincian Deskripsi:</div>
            <div className="font-sans font-medium text-slate-800 text-xs whitespace-pre-wrap">
              {transaction.description}
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-sm">
            <span className="font-bold font-sans text-slate-700">TOTAL NOMINAL</span>
            <span
              className={`font-black font-sans text-base ${
                transaction.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formattedAmount}
            </span>
          </div>

          <div className="text-center pt-3 text-[10px] text-slate-400 font-sans border-t border-dashed border-slate-200">
            Terima kasih telah mempercayakan layanan kepada kami.
            <br />
            Data tersinkron otomatis ke Google Sheets.
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
