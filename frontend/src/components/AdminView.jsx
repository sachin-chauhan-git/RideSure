import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapComponent } from './MapComponent';
import { Users, Car, Zap, TrendingUp, Activity, RefreshCw, Calendar, Lock } from 'lucide-react';

export const AdminView = () => {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [surge, setSurge] = useState(1.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, driversData, ridesData, subsData] = await Promise.all([
        api.getAdminStats(),
        api.getAllDrivers(),
        api.getAllRides(),
        api.getAllSubscriptions().catch(() => []),
      ]);
      setStats(statsData);
      setDrivers(driversData || []);
      setRides(ridesData || []);
      setSubscriptions(subsData || []);
      if (statsData?.currentSurge) {
        setSurge(statsData.currentSurge);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  const handleSurgeUpdate = async (val) => {
    setSurge(val);
    try {
      await api.setSurgeMultiplier(val);
    } catch (err) {
      console.error('Failed to update surge');
    }
  };

  const mapCenter = { lat: 28.4744, lng: 77.5040 };
  const onlineDriverMarkers = drivers
    .filter((d) => d.currentLat && d.currentLng)
    .map((d) => ({
      driverId: d.userId,
      lat: d.currentLat,
      lng: d.currentLng,
      vehicleType: d.vehicleType,
    }));

  const totalEscrowLocked = subscriptions
    .filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING_DRIVER')
    .reduce((acc, s) => acc + (s.escrowAmountLocked || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Users</span>
            <p className="text-xl font-bold text-white">{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Online Drivers</span>
            <p className="text-xl font-bold text-emerald-400">{stats?.onlineDrivers || 0}</p>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Commute Passes</span>
            <p className="text-xl font-bold text-purple-400">{subscriptions.length}</p>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Reserved Pass Capital</span>
            <p className="text-xl font-bold text-amber-400">₹{totalEscrowLocked.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Completed GMV</span>
            <p className="text-xl font-bold text-white">
              ₹
              {rides
                .filter((r) => r.status === 'COMPLETED')
                .reduce((acc, r) => acc + (r.finalFare || r.estimatedFare), 0)
                .toFixed(0)}
            </p>
          </div>
        </div>

        {/* Dynamic Surge Multiplier Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" /> Surge Multiplier
            </span>
            <span className="text-lg font-black text-amber-400">{surge.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={surge}
            onChange={(e) => handleSurgeUpdate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
          />
        </div>
      </div>

      {/* Main Grid: Map & Live Drivers Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[460px]">
        <div className="lg:col-span-7 h-full">
          <MapComponent center={mapCenter} nearbyDrivers={onlineDriverMarkers} />
        </div>

        {/* Driver Fleet Table */}
        <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="font-bold text-white text-sm">Active Fleet Status</h3>
            <button onClick={fetchData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {drivers.map((d) => (
              <div key={d.id} className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{d.driverName}</span>
                    <span className={`w-2 h-2 rounded-full ${d.online ? (d.busy ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-500'}`} />
                  </div>
                  <p className="text-slate-400 mt-0.5 font-mono">{d.vehicleNumber} • {d.vehicleType}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                    d.online ? (d.busy ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300') : 'bg-slate-800 text-slate-400'
                  }`}>
                    {d.online ? (d.busy ? 'BUSY (IN TRIP)' : 'AVAILABLE') : 'OFFLINE'}
                  </span>
                  <p className="text-slate-400 text-[11px] mt-1">{d.totalTrips} trips</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow">
        <h3 className="font-bold text-white text-base mb-4">Recurring Commute Passes (Active Contracts)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Pass ID</th>
                <th className="py-3 px-4">Passenger</th>
                <th className="py-3 px-4">Dedicated Driver</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Time Slots</th>
                <th className="py-3 px-4">Escrow Package</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-white">#{s.id}</td>
                  <td className="py-3 px-4">{s.riderName}</td>
                  <td className="py-3 px-4">{s.driverName || <span className="text-amber-400 italic">Open in Marketplace</span>}</td>
                  <td className="py-3 px-4">{s.subscriptionType} ({s.totalDays} Days)</td>
                  <td className="py-3 px-4 font-mono">{s.outwardTimeSlot} {s.returnTimeSlot && `& ${s.returnTimeSlot}`}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">₹{s.totalPackageCost}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500 italic">
                    No commute subscriptions created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
