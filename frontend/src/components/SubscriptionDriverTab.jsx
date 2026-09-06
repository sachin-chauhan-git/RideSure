import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Zap,
  MapPin,
  AlertCircle,
  Play
} from 'lucide-react';

export const SubscriptionDriverTab = () => {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'my'
  const [marketplace, setMarketplace] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for new marketplace contracts over WebSocket
  useEffect(() => {
    const unsub = wsService.subscribe('/topic/subscriptions/marketplace', () => {
      fetchData();
    });
    return () => unsub && unsub();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marketData, myData] = await Promise.all([
        api.getDriverMarketplace(),
        api.getMyDriverSubscriptions(),
      ]);
      setMarketplace(marketData || []);
      setMySubscriptions(myData || []);
    } catch (err) {
      console.error('Error fetching driver subscription data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimContract = async (subId) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.acceptSubscription(subId);
      setSuccessMsg('Commute Contract Claimed! You are now the dedicated driver for this route.');
      fetchData();
      setActiveTab('my');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to claim contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDailyTrip = async (subId) => {
    try {
      await api.simulateDailyDispatch(subId);
      setSuccessMsg("Today's commute dispatched! Check your active ride console.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to dispatch trip');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Driver Commute Marketplace</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                💰 Guaranteed Monthly Income
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Claim multi-day recurring daily commute contracts. Guaranteed payouts credited directly to your wallet!
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'marketplace'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Available Contracts ({marketplace.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'my'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Commutes ({mySubscriptions.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. AVAILABLE CONTRACTS MARKETPLACE */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Open Rider Commute Contracts in Your City
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplace.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl hover:border-amber-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {sub.subscriptionType.replace('_', ' ')} • {sub.totalDays} DAYS CONTRACT
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">Rider: {sub.riderName}</h4>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400">₹{sub.totalPackageCost}</span>
                    <p className="text-[10px] text-slate-400 font-mono">Guaranteed Payout</p>
                  </div>
                </div>

                {/* Route & Times */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
                    <div>
                      <span className="text-slate-400">Pickup:</span> <strong className="text-slate-200">{sub.pickupAddress}</strong>
                      <span className="text-amber-400 ml-2 font-mono font-bold">⏰ {sub.outwardTimeSlot}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1" />
                    <div>
                      <span className="text-slate-400">Dropoff:</span> <strong className="text-slate-200">{sub.dropoffAddress}</strong>
                      {sub.returnTimeSlot && (
                        <span className="text-purple-400 ml-2 font-mono font-bold">⏰ Return {sub.returnTimeSlot}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>📅 {sub.startDate} to {sub.endDate}</span>
                  <span>⚡ 20-min buffer prior</span>
                </div>

                <button
                  onClick={() => handleClaimContract(sub.id)}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition disabled:opacity-50"
                >
                  Claim Contract (Earn ₹{sub.totalPackageCost})
                </button>
              </div>
            ))}

            {marketplace.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Open Contracts Right Now</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When riders create 10 or 30-day commute passes in the Rider tab, they will appear here for you to claim!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MY COMMITTED COMMUTES */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Claimed Commute Routes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ACTIVE COMMUTE CONTRACT
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">Passenger: {sub.riderName}</h4>
                    <p className="text-xs text-slate-400">{sub.riderPhone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">₹{sub.totalPackageCost}</span>
                    <p className="text-[10px] text-slate-400">₹{sub.perRideFare} / day payout</p>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300"><strong className="text-emerald-400">Pickup:</strong> {sub.pickupAddress} (⏰ {sub.outwardTimeSlot})</p>
                  <p className="text-slate-300"><strong className="text-rose-400">Dropoff:</strong> {sub.dropoffAddress} {sub.returnTimeSlot && `(⏰ Return ${sub.returnTimeSlot})`}</p>
                </div>

                {/* 20-min Buffer Warning Box */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 20-Minute Driver Buffer Active
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The platform will automatically freeze random on-demand dispatches 20 mins before your commute slot to guarantee on-time arrival.
                  </p>
                </div>

                {/* Simulate today's trip button */}
                <button
                  onClick={() => handleSimulateDailyTrip(sub.id)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> ⚡ Trigger Today's Commute Dispatch
                </button>
              </div>
            ))}

            {mySubscriptions.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Claimed Commutes Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Browse the Available Contracts tab and claim a long-term pass to start earning guaranteed daily income!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
