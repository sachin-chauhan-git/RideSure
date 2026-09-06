import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bike, Shield, User, LogOut, ChevronDown, Wallet as WalletIcon, Sparkles } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenWallet, walletUpdated }) => {
  const { user, logout, switchQuickAccount } = useAuth();
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (user) {
      api.getWalletBalance()
        .then((w) => setWalletBalance(w?.availableBalance || 0))
        .catch(() => {});
    } else {
      setWalletBalance(null);
    }
  }, [user, walletUpdated]);

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                RideSure <span className="text-xs bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">PRO</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">On-Demand Rides & Daily Passes</p>
          </div>
        </div>

        {/* Center Role Navigation Tabs */}
        <nav className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab('rider')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'rider'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Rider Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'driver'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Driver Partner</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Right Section: Wallet & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Wallet Button */}
          {user && (
            <button
              onClick={onOpenWallet}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/50 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition shadow"
            >
              <div className="p-1 bg-amber-400 text-slate-950 rounded-lg">
                <WalletIcon className="w-3.5 h-3.5" />
              </div>
              <span>₹{walletBalance !== null ? walletBalance.toFixed(0) : '0'}</span>
            </button>
          )}

          {/* Quick Demo Switcher */}
          <div className="relative group">
            <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition">
              <span>⚡ Switch Role</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700">
                1-Click Test Login
              </div>
              <button
                onClick={() => {
                  switchQuickAccount('rider');
                  setActiveTab('rider');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-amber-400"
              >
                👤 Rahul (Rider)
              </button>
              <button
                onClick={() => {
                  switchQuickAccount('bikeDriver');
                  setActiveTab('driver');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-amber-400"
              >
                🏍️ Suresh (Bike Driver)
              </button>
              <button
                onClick={() => {
                  switchQuickAccount('cabDriver');
                  setActiveTab('driver');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-amber-400"
              >
                🚗 Amit (Cab Driver)
              </button>
              <button
                onClick={() => {
                  switchQuickAccount('admin');
                  setActiveTab('admin');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-amber-400"
              >
                🛡️ Platform Admin
              </button>
            </div>
          </div>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                {user.name?.[0]}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[90px] truncate">{user.name}</span>
              <button
                onClick={logout}
                title="Logout"
                className="text-slate-400 hover:text-rose-400 ml-1 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-bold shadow transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
