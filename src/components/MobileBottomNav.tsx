import React from 'react';
import { LayoutDashboard, Calendar, Wallet, Package } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'bookings' | 'cashier' | 'inventory';
  setActiveTab: (tab: 'dashboard' | 'bookings' | 'cashier' | 'inventory') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Booking', icon: Calendar },
    { id: 'cashier', label: 'Kasir', icon: Wallet },
    { id: 'inventory', label: 'Inventaris', icon: Package },
  ] as const;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-emerald-900/10 px-3 py-2 shadow-lg pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#0D8A5B] bg-emerald-50/80 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 text-[#0D8A5B]' : ''}`} />
              <span className="text-[10px] tracking-tight truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
