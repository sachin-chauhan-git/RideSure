import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Wallet as WalletIcon, Lock, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

export const WalletModal = ({ isOpen, onClose, onBalanceUpdate }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState(1500);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen]);

  const fetchWalletData = async () => {
    try {
      const [walletData, txnsData] = await Promise.all([
        api.getWalletBalance(),
        api.getWalletTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(txnsData || []);
      if (onBalanceUpdate) onBalanceUpdate(walletData);
    } catch (err) {
      console.error('Error fetching wallet data', err);
    }
  };

  const handleTopup = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await api.topupWallet(parseFloat(amount), paymentMethod);
      setWallet(updated);
      setSuccessMsg(`₹${amount} added successfully via ${paymentMethod}!`);
      fetchWalletData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to top-up wallet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <WalletIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">RideSure In-App Wallet</h2>
            <p className="text-xs text-slate-400">Prepaid balance for daily rides and recurring commute passes</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 mb-5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available Balance</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              ₹{wallet?.availableBalance?.toFixed(2) || '0.00'}
            </p>
            <span className="text-[10px] text-slate-400">Ready to spend</span>
          </div>

          <div className="border-l border-slate-700 pl-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Reserved for Active Passes
            </span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">
              ₹{wallet?.lockedEscrowBalance?.toFixed(2) || '0.00'}
            </p>
            <span className="text-[10px] text-slate-400">Auto-deducted daily after each trip</span>
          </div>
        </div>

        {/* Top-up Form */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3 mb-5">
          <h3 className="text-xs font-bold uppercase text-slate-300">Add Money to Wallet</h3>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1500, 3000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                  amount === val
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                +₹{val}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                placeholder="Enter amount"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="UPI">UPI (GooglePay / PhonePe)</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="NETBANKING">NetBanking</option>
            </select>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {successMsg && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
            </p>
          )}

          <button
            onClick={handleTopup}
            disabled={loading || !amount}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Instant Top-Up ₹${amount || 0}`}
          </button>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Recent Wallet Statement</h4>
            <button onClick={fetchWalletData} className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${
                  txn.type === 'TOPUP' || txn.type === 'DRIVER_PAYOUT' || txn.type === 'REFUND'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {txn.type === 'TOPUP' || txn.type === 'DRIVER_PAYOUT' || txn.type === 'REFUND' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{txn.description}</p>
                  <span className="text-[10px] text-slate-400">{new Date(txn.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-black text-sm ${
                  txn.type === 'TOPUP' || txn.type === 'DRIVER_PAYOUT' || txn.type === 'REFUND'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {txn.type === 'TOPUP' || txn.type === 'DRIVER_PAYOUT' || txn.type === 'REFUND' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                </span>
                <p className="text-[10px] text-slate-400 font-mono">{txn.type}</p>
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <p className="text-center text-slate-500 text-xs py-4">No wallet transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
