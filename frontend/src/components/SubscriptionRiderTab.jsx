import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { MapComponent } from './MapComponent';
import { MapPickerModal } from './MapPickerModal';
import {
  Calendar,
  Clock,
  Repeat,
  ShieldCheck,
  Zap,
  Sparkles,
  Bike,
  Car,
  AlertCircle,
  CheckCircle2,
  Lock,
  Play,
  XCircle,
  Star,
  MapPin,
  Navigation,
  Map as MapIcon,
  SlidersHorizontal
} from 'lucide-react';

const PRESET_LOCATIONS = [
  { name: 'Pari Chowk Metro Station', lat: 28.4633, lng: 77.5082 },
  { name: 'India Expo Mart (KP II)', lat: 28.4570, lng: 77.5000 },
  { name: 'Sharda University (KP III)', lat: 28.4725, lng: 77.4833 },
  { name: 'The Grand Venice Mall', lat: 28.4529, lng: 77.5260 },
  { name: 'Alpha 1 Metro Station', lat: 28.4709, lng: 77.5126 },
  { name: 'Gaur City Mall (GN West)', lat: 28.6054, lng: 77.4281 },
  { name: 'Gautam Buddha University (GBU)', lat: 28.4239, lng: 77.5332 },
  { name: 'Yatharth Hospital (Omega 1)', lat: 28.4700, lng: 77.4870 },
];

export const SubscriptionRiderTab = ({ onOpenWallet, walletBalance }) => {
  const [viewMode, setViewMode] = useState('passes'); // 'passes' or 'new'
  const [mobileTab, setMobileTab] = useState('booking'); // 'booking' or 'map'
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('pickup');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectingFor, setSelectingFor] = useState('dropoff'); // 'pickup' or 'dropoff'

  // Booking Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 29 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [subscriptionType, setSubscriptionType] = useState('ROUND_TRIP'); // 'ONE_WAY' or 'ROUND_TRIP'
  const [outwardTime, setOutwardTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('18:30');
  const [pickup, setPickup] = useState(PRESET_LOCATIONS[0]);
  const [dropoff, setDropoff] = useState(PRESET_LOCATIONS[1]);
  const [vehicleType, setVehicleType] = useState('BIKE');
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Listen for WebSocket updates on subscription dispatches
  useEffect(() => {
    const unsub = wsService.subscribe('/topic/subscriptions/claimed', () => {
      fetchSubscriptions();
    });
    return () => unsub && unsub();
  }, []);

  // Re-calculate estimate whenever form fields change
  useEffect(() => {
    if (pickup && dropoff && startDate && endDate) {
      calculateEstimate();
    }
  }, [pickup, dropoff, startDate, endDate, subscriptionType, vehicleType]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await api.getMyRiderSubscriptions();
      setSubscriptions(data || []);
      if (data && data.length > 0) {
        setViewMode('passes');
      } else {
        setViewMode('new');
      }
    } catch (err) {
      console.error('Error fetching subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateClientSubscription = (pickupLoc, dropoffLoc, sDate, eDate, subType, vType) => {
    if (!pickupLoc?.lat || !dropoffLoc?.lat) return null;
    const R = 6371;
    const dLat = ((dropoffLoc.lat - pickupLoc.lat) * Math.PI) / 180;
    const dLon = ((dropoffLoc.lng - pickupLoc.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLoc.lat * Math.PI) / 180) *
        Math.cos((dropoffLoc.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const rawDist = Math.max(0.5, R * c * 1.3);
    const distanceKm = Math.round(rawDist * 10) / 10;
    const durationMinutes = Math.max(3, Math.round(distanceKm * 2.5));

    const rates = {
      BIKE: { base: 20, km: 8, min: 1.5 },
      AUTO: { base: 30, km: 12, min: 2.0 },
      CAB_ECONOMY: { base: 50, km: 15, min: 2.5 },
      CAB_PREMIUM: { base: 80, km: 20, min: 3.5 },
    };
    const r = rates[vType] || rates.BIKE;
    const baseSingleFare = Math.round((r.base + distanceKm * r.km + durationMinutes * r.min) * 10) / 10;

    const start = new Date(sDate);
    const end = new Date(eDate);
    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const tripsPerDay = subType === 'ROUND_TRIP' ? 2 : 1;
    const totalTrips = diffDays * tripsPerDay;

    let discountPercentage = 0;
    if (diffDays >= 30) discountPercentage = 25;
    else if (diffDays >= 20) discountPercentage = 20;
    else if (diffDays >= 10) discountPercentage = 15;
    else if (diffDays >= 5) discountPercentage = 10;

    const standardTotalCost = Math.round(baseSingleFare * totalTrips * 10) / 10;
    const discountedPackageCost = Math.round((standardTotalCost * (1 - discountPercentage / 100)) * 10) / 10;
    const totalSavings = Math.round((standardTotalCost - discountedPackageCost) * 10) / 10;
    const dailyEffectiveRate = Math.round((discountedPackageCost / diffDays) * 10) / 10;

    return {
      distanceKm,
      durationMinutes,
      baseSingleFare,
      totalDays: diffDays,
      totalTrips,
      discountPercentage,
      standardTotalCost,
      discountedPackageCost,
      totalSavings,
      dailyEffectiveRate,
    };
  };

  const calculateEstimate = async () => {
    const fallback = calculateClientSubscription(pickup, dropoff, startDate, endDate, subscriptionType, vehicleType);
    if (fallback) {
      setEstimate((prev) => prev || fallback);
    }
    setError('');
    try {
      const data = await api.estimateSubscription({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        vehicleType,
        subscriptionType,
        startDate,
        endDate,
      });
      if (data) {
        setEstimate(data);
      } else if (fallback) {
        setEstimate(fallback);
      }
    } catch (err) {
      if (fallback) {
        setEstimate(fallback);
      } else {
        setError('Could not calculate pass estimate');
      }
    }
  };

  const handleCreateSubscription = async () => {
    if (!estimate) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.createSubscription({
        vehicleType,
        subscriptionType,
        startDate,
        endDate,
        pickupAddress: pickup.name,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.name,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        outwardTimeSlot: outwardTime,
        returnTimeSlot: subscriptionType === 'ROUND_TRIP' ? returnTime : null,
        distanceKm: estimate.distanceKm,
        perRideFare: estimate.baseSingleFare,
        discountPercentage: estimate.discountPercentage,
        totalPackageCost: estimate.discountedPackageCost,
        routePolyline: estimate.routePolyline,
      });

      setSuccessMsg('Daily Pass activated successfully! Dedicated drivers in your area are being notified.');
      fetchSubscriptions();
      setViewMode('passes');
    } catch (err) {
      setError(err.message || 'Failed to activate pass');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateToday = async (subId) => {
    try {
      await api.simulateDailyDispatch(subId);
      fetchSubscriptions();
      setSuccessMsg("Today's ride dispatched! 4-Digit OTP is ready.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    }
  };

  const handleCancelSub = async (subId) => {
    if (!window.confirm('Cancel this pass? Unused days will be refunded to your wallet immediately.')) return;
    try {
      await api.cancelSubscription(subId);
      fetchSubscriptions();
    } catch (err) {
      setError('Failed to cancel pass');
    }
  };

  const handleMapClick = (coords) => {
    const pinName = coords.name || `Map Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    if (selectingFor === 'pickup') {
      setPickup({ name: pinName, lat: coords.lat, lng: coords.lng });
      setSelectingFor('dropoff');
    } else {
      setDropoff({ name: pinName, lat: coords.lat, lng: coords.lng });
    }
  };

  const handleSelectPlace = (place) => {
    if (selectingFor === 'pickup') {
      setPickup({ name: place.name, lat: place.lat, lng: place.lng });
      setSelectingFor('dropoff');
    } else {
      setDropoff({ name: place.name, lat: place.lat, lng: place.lng });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">RideSure Daily Pass</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ⚡ Save up to 25%
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Fixed daily rides for office, college & daily commute in Greater Noida.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'new' ? 'passes' : 'new')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow transition"
          >
            {viewMode === 'new' ? 'View My Active Passes' : '+ Book New Daily Pass'}
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

      {/* VIEW 1: MY ACTIVE PASSES */}
      {viewMode === 'passes' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>My Active Daily Passes</span>
            <span className="bg-slate-800 text-amber-400 text-xs px-2 py-0.5 rounded-full">
              {subscriptions.length}
            </span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {subscriptions.map((sub) => {
              const todayRides = sub.dailyRides?.filter((r) => r.tripDate === todayStr) || [];
              const activeDailyTrip = todayRides.find((r) => r.status === 'DISPATCHED' || r.status === 'BUFFER_ACTIVE');

              return (
                <div key={sub.id} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {sub.subscriptionType.replace('_', ' ')} • {sub.totalDays} DAYS PASS
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {sub.startDate} to {sub.endDate} ({sub.totalDays} Consecutive Days)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400">₹{sub.totalPackageCost}</span>
                      <p className="text-[10px] text-slate-400 font-mono">₹{sub.perRideFare}/trip</p>
                    </div>
                  </div>

                  {/* Route & Schedule */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
                      <div>
                        <span className="text-slate-400">Pickup:</span> <strong className="text-slate-200">{sub.pickupAddress}</strong>
                        <span className="text-amber-400 ml-2 font-mono">⏰ {sub.outwardTimeSlot}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400 mt-1" />
                      <div>
                        <span className="text-slate-400">Dropoff:</span> <strong className="text-slate-200">{sub.dropoffAddress}</strong>
                        {sub.returnTimeSlot && (
                          <span className="text-purple-400 ml-2 font-mono">⏰ Return {sub.returnTimeSlot}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Assignment Card */}
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                    {sub.driverName ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center">
                          {sub.driverName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{sub.driverName} (Dedicated Driver)</p>
                          <span className="text-slate-400 text-[10px] font-mono">{sub.vehicleNumber}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Matching dedicated driver in Greater Noida...</span>
                      </div>
                    )}
                  </div>

                  {/* Today's Commute Trip Box */}
                  <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Today's Scheduled Trip
                      </span>
                      {activeDailyTrip?.otp && (
                        <div className="bg-amber-400/20 border border-amber-400/50 px-2 py-0.5 rounded text-amber-300 text-xs font-black tracking-widest">
                          OTP: {activeDailyTrip.otp}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Auto-dispatch runs 15 mins before time slot. Driver buffer locks 20 mins prior.
                    </p>

                    {/* Simulation Button */}
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleSimulateToday(sub.id)}
                        className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> ⚡ Simulate Today's Trip
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {sub.status !== 'CANCELLED' && sub.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancelSub(sub.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Cancel Pass & Refund Remaining Balance
                    </button>
                  )}
                </div>
              );
            })}

            {subscriptions.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Active Daily Passes</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Book a 10 or 30-Day Pass for your college or office commute at discounted daily rates!
                </p>
                <button
                  onClick={() => setViewMode('new')}
                  className="px-5 py-2.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  Book Daily Pass
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: BOOKING WIZARD WITH INTEGRATED GREATER NOIDA MAP */}
      {viewMode === 'new' && (
        <div className="space-y-3">
          {/* Mobile / Half-Screen View Tab Switcher (Visible on < lg) */}
          <div className="flex lg:hidden items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMobileTab('booking')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                mobileTab === 'booking'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pass Configuration</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('map')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                mobileTab === 'map'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Commute Map</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
            {/* Left Form Controls */}
            <div className={`lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 overflow-y-auto max-h-[700px] ${
              mobileTab === 'booking' ? 'block' : 'hidden lg:block'
            }`}>
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Book Daily Pass</h3>
                <p className="text-xs text-slate-400">Configure your daily commute schedule</p>
              </div>

              {/* 1. Trip Direction */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase mb-1.5 block">1. Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubscriptionType('ONE_WAY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                      subscriptionType === 'ONE_WAY'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>One-Way (Morning)</span>
                    <span className="text-[10px] text-slate-400">1 Trip / Day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubscriptionType('ROUND_TRIP')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                      subscriptionType === 'ROUND_TRIP'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>Round-Trip</span>
                    <span className="text-[10px] text-slate-400">2 Trips / Day</span>
                  </button>
                </div>
              </div>

              {/* 2. Date Range */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase mb-1.5 block">2. Duration (Consecutive Days)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      min={todayStr}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
                {estimate && (
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">
                    📅 {estimate.totalDays} Consecutive Days • {estimate.totalTrips} Total Rides
                  </p>
                )}
              </div>

              {/* 3. Time Slots */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase mb-1.5 block">3. Daily Time Slots</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Morning Pickup Slot</label>
                    <input
                      type="time"
                      value={outwardTime}
                      onChange={(e) => setOutwardTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  {subscriptionType === 'ROUND_TRIP' && (
                    <div>
                      <label className="text-[10px] text-slate-400">Evening Return Slot</label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Commute Route Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase block">4. Commute Route</label>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Pickup Location
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMapPickerTarget('pickup');
                        setIsMapPickerOpen(true);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      <MapIcon className="w-3 h-3" /> Select on Map
                    </button>
                  </div>
                  <select
                    value={pickup.name}
                    onChange={(e) => {
                      const l = PRESET_LOCATIONS.find((x) => x.name === e.target.value);
                      if (l) setPickup(l);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {PRESET_LOCATIONS.map((l) => (
                      <option key={l.name} value={l.name}>{l.name}</option>
                    ))}
                    {!PRESET_LOCATIONS.some((l) => l.name === pickup.name) && (
                      <option value={pickup.name}>{pickup.name}</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Dropoff (Destination)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMapPickerTarget('dropoff');
                        setIsMapPickerOpen(true);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      <MapIcon className="w-3 h-3" /> Select on Map
                    </button>
                  </div>
                  <select
                    value={dropoff.name}
                    onChange={(e) => {
                      const l = PRESET_LOCATIONS.find((x) => x.name === e.target.value);
                      if (l) setDropoff(l);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    {PRESET_LOCATIONS.map((l) => (
                      <option key={l.name} value={l.name}>{l.name}</option>
                    ))}
                    {!PRESET_LOCATIONS.some((l) => l.name === dropoff.name) && (
                      <option value={dropoff.name}>{dropoff.name}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* 5. Select Vehicle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase block">5. Vehicle Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BIKE', name: 'Rapido Bike', icon: <Bike className="w-4 h-4" /> },
                    { id: 'AUTO', name: 'Auto Rickshaw', icon: <span className="text-sm">🛺</span> },
                    { id: 'CAB_ECONOMY', name: 'Economy Cab', icon: <Car className="w-4 h-4 text-emerald-400" /> },
                    { id: 'CAB_PREMIUM', name: 'Sedan / SUV', icon: <Car className="w-4 h-4 text-purple-400" /> },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                        vehicleType === v.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {v.icon}
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Summary Card */}
              {estimate && (
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <span className="text-slate-400">Standard Rate ({estimate.totalTrips} rides):</span>
                    <span className="line-through text-slate-500 font-mono">₹{estimate.standardTotalCost}</span>
                  </div>

                  {estimate.discountPercentage > 0 && (
                    <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-current" /> {estimate.discountPercentage}% Multi-Day Discount:
                      </span>
                      <span className="font-black">-₹{estimate.totalSavings}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-300">Total Pass Package</span>
                      <p className="text-[10px] text-slate-400">Auto-deducted daily upon ride completion</p>
                    </div>
                    <span className="text-xl font-black text-emerald-400">₹{estimate.discountedPackageCost}</span>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Effective Daily Cost:</span>
                    <strong className="text-amber-400 text-xs">₹{estimate.dailyEffectiveRate} / day</strong>
                  </div>

                  {/* Low Balance Warning */}
                  {estimate && walletBalance !== null && walletBalance < estimate.discountedPackageCost && (
                    <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-300 font-bold">Low Wallet Balance:</span>
                        <span className="text-white font-mono">₹{walletBalance.toFixed(0)} / ₹{estimate.discountedPackageCost}</span>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenWallet}
                        className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shadow transition"
                      >
                        + Top Up Wallet Now
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateSubscription}
                    disabled={loading || (walletBalance !== null && walletBalance < estimate.discountedPackageCost)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Activating Pass...' : `Confirm & Activate Pass (₹${estimate.discountedPackageCost})`}
                  </button>

                  {/* View on Map button for mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('map')}
                    className="w-full lg:hidden py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Commute Route on Map</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Interactive Greater Noida Map */}
            <div className={`lg:col-span-7 flex-col gap-2 min-h-[440px] ${
              mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
            }`}>
              {/* Quick Landmarks Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Places:</span>
                {[
                  { name: 'Pari Chowk', lat: 28.4633, lng: 77.5082, emoji: '🚇' },
                  { name: 'Expo Mart', lat: 28.4570, lng: 77.5000, emoji: '🏛️' },
                  { name: 'Sharda Univ', lat: 28.4725, lng: 77.4833, emoji: '🎓' },
                  { name: 'Venice Mall', lat: 28.4529, lng: 77.5260, emoji: '🛍️' },
                  { name: 'Alpha 1', lat: 28.4709, lng: 77.5126, emoji: '🏢' },
                  { name: 'Gaur City', lat: 28.6054, lng: 77.4281, emoji: '🛍️' },
                  { name: 'GBU Campus', lat: 28.4239, lng: 77.5332, emoji: '🎓' },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPlace(p)}
                    className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 hover:text-white shrink-0 flex items-center gap-1 transition shadow"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Map Canvas */}
              <div className="flex-1 min-h-[400px] relative">
                <MapComponent
                  center={{ lat: pickup.lat, lng: pickup.lng }}
                  pickup={pickup}
                  dropoff={dropoff}
                  routePolyline={estimate?.routePolyline}
                  onMapClick={handleMapClick}
                  onSelectPlace={handleSelectPlace}
                />

                {/* Back to Schedule floating button on mobile */}
                <div className="absolute bottom-3 left-3 right-3 lg:hidden z-[1000]">
                  <button
                    type="button"
                    onClick={() => setMobileTab('booking')}
                    className="w-full py-2.5 bg-slate-900/95 backdrop-blur border border-amber-400/60 text-amber-400 font-bold text-xs rounded-xl shadow-2xl flex items-center justify-center gap-2"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Back to Pass Configuration (₹{estimate?.discountedPackageCost || '0'})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Picker Modal */}
          <MapPickerModal
            isOpen={isMapPickerOpen}
            onClose={() => setIsMapPickerOpen(false)}
            target={mapPickerTarget}
            initialLocation={mapPickerTarget === 'pickup' ? pickup : dropoff}
            onConfirmLocation={(loc, target) => {
              if (target === 'pickup') {
                setPickup(loc);
              } else {
                setDropoff(loc);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
