import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { MapComponent } from './MapComponent';
import { SubscriptionRiderTab } from './SubscriptionRiderTab';
import { Bike, Car, Navigation, ShieldCheck, Clock, MapPin, AlertCircle, Phone, Star, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

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

export const RiderView = ({ user, onOpenWallet }) => {
  const [riderMode, setRiderMode] = useState('ondemand'); // 'ondemand' or 'subscription'
  const [walletBalance, setWalletBalance] = useState(null);
  const [pickup, setPickup] = useState(PRESET_LOCATIONS[0]);
  const [dropoff, setDropoff] = useState(PRESET_LOCATIONS[1]);
  const [estimate, setEstimate] = useState(null);
  const [selectedTier, setSelectedTier] = useState('BIKE');
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [selectingFor, setSelectingFor] = useState('dropoff'); // 'pickup' or 'dropoff'

  // Fetch active ride, nearby drivers, and wallet on mount
  useEffect(() => {
    fetchActiveRide();
    fetchNearbyDrivers();
    fetchWalletBalance();

    const interval = setInterval(() => {
      fetchNearbyDrivers();
      fetchWalletBalance();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const w = await api.getWalletBalance();
      if (w) setWalletBalance(w.availableBalance);
    } catch (e) {}
  };

  // Fetch fare estimate when pickup or dropoff changes
  useEffect(() => {
    if (pickup && dropoff && !activeRide && riderMode === 'ondemand') {
      calculateFare();
    }
  }, [pickup, dropoff, activeRide, riderMode]);

  // Subscribe to ride topic when ride is active
  useEffect(() => {
    if (!activeRide?.id) return;

    const unsubscribe = wsService.subscribe(`/topic/ride/${activeRide.id}`, (updatedRide) => {
      console.log('Real-time Ride Update:', updatedRide);
      setActiveRide(updatedRide);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [activeRide?.id]);

  const fetchActiveRide = async () => {
    try {
      const ride = await api.getActiveRide();
      if (ride) {
        setActiveRide(ride);
        setPickup({ name: ride.pickupAddress, lat: ride.pickupLat, lng: ride.pickupLng });
        setDropoff({ name: ride.dropoffAddress, lat: ride.dropoffLat, lng: ride.dropoffLng });
      }
    } catch (err) {
      console.error('Error fetching active ride', err);
    }
  };

  const fetchNearbyDrivers = async () => {
    if (!pickup) return;
    try {
      const drivers = await api.getNearbyDrivers(pickup.lat, pickup.lng, 10);
      setNearbyDrivers(drivers || []);
    } catch (err) {
      console.warn('Could not fetch nearby drivers');
    }
  };

  const calculateClientFare = (pickupLoc, dropoffLoc) => {
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

    const tiers = [
      {
        vehicleType: 'BIKE',
        displayName: 'Bike Taxi (Rapido style)',
        fare: Math.round((20 + distanceKm * 8 + durationMinutes * 1.5) * 10) / 10,
        capacity: 1,
        etaMinutes: 3,
        surgeMultiplier: 1.0,
      },
      {
        vehicleType: 'AUTO',
        displayName: 'Auto Rickshaw',
        fare: Math.round((30 + distanceKm * 12 + durationMinutes * 2.0) * 10) / 10,
        capacity: 3,
        etaMinutes: 5,
        surgeMultiplier: 1.0,
      },
      {
        vehicleType: 'CAB_ECONOMY',
        displayName: 'Economy Cab (Mini)',
        fare: Math.round((50 + distanceKm * 15 + durationMinutes * 2.5) * 10) / 10,
        capacity: 4,
        etaMinutes: 6,
        surgeMultiplier: 1.0,
      },
      {
        vehicleType: 'CAB_PREMIUM',
        displayName: 'Premium Cab (Sedan/SUV)',
        fare: Math.round((80 + distanceKm * 20 + durationMinutes * 3.5) * 10) / 10,
        capacity: 4,
        etaMinutes: 8,
        surgeMultiplier: 1.0,
      },
    ];

    return { distanceKm, durationMinutes, tiers };
  };

  const calculateFare = async () => {
    // Provide instantaneous client-side estimation immediately
    const fallbackEstimate = calculateClientFare(pickup, dropoff);
    if (fallbackEstimate) {
      setEstimate((prev) => prev || fallbackEstimate);
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.estimateFare({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
      });
      if (data && data.tiers) {
        setEstimate(data);
      } else if (fallbackEstimate) {
        setEstimate(fallbackEstimate);
      }
    } catch (err) {
      if (fallbackEstimate) {
        setEstimate(fallbackEstimate);
      } else {
        setError('Could not calculate fare estimate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!estimate) return;
    const tier = estimate.tiers.find((t) => t.vehicleType === selectedTier) || estimate.tiers[0];
    setLoading(true);
    setError('');

    try {
      const ride = await api.requestRide({
        vehicleType: selectedTier,
        pickupAddress: pickup.name,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.name,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        distanceKm: estimate.distanceKm,
        durationMinutes: estimate.durationMinutes,
        estimatedFare: tier.fare,
        routePolyline: estimate.routePolyline,
      });
      setActiveRide(ride);
    } catch (err) {
      setError(err.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await api.cancelRide(activeRide.id, 'Cancelled by rider');
      setActiveRide(null);
      calculateFare();
    } catch (err) {
      setError('Failed to cancel ride');
    }
  };

  const handleMapClick = (coords) => {
    if (activeRide) return;
    const pinName = coords.name || `Map Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    if (selectingFor === 'pickup') {
      setPickup({ name: pinName, lat: coords.lat, lng: coords.lng });
      setSelectingFor('dropoff');
    } else {
      setDropoff({ name: pinName, lat: coords.lat, lng: coords.lng });
    }
  };

  const handleSelectPlace = (place) => {
    if (activeRide) return;
    if (selectingFor === 'pickup') {
      setPickup({ name: place.name, lat: place.lat, lng: place.lng });
      setSelectingFor('dropoff');
    } else {
      setDropoff({ name: place.name, lat: place.lat, lng: place.lng });
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'BIKE':
        return <Bike className="w-6 h-6 text-amber-400" />;
      case 'AUTO':
        return <span className="text-xl">🛺</span>;
      case 'CAB_PREMIUM':
        return <Car className="w-6 h-6 text-purple-400" />;
      default:
        return <Car className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRiderMode('ondemand')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              riderMode === 'ondemand'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>⚡ Instant On-Demand Ride</span>
          </button>

          <button
            onClick={() => setRiderMode('subscription')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              riderMode === 'subscription'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📅 Daily Pass (10-30 Days)</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-black border border-emerald-500/30">
              SAVE 25%
            </span>
          </button>
        </div>

        <button
          onClick={onOpenWallet}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-xl"
        >
          My Wallet
        </button>
      </div>

      {/* Mode 1: Subscription Commute Pass View */}
      {riderMode === 'subscription' && (
        <SubscriptionRiderTab onOpenWallet={onOpenWallet} walletBalance={walletBalance} />
      )}

      {/* Mode 2: Standard Instant On-Demand Ride View */}
      {riderMode === 'ondemand' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
          {/* Left Control / Booking Panel */}
          <div className="lg:col-span-5 flex flex-col bg-slate-800/95 backdrop-blur rounded-2xl p-5 border border-slate-700/80 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Book Instant Ride</span>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
                    Live Nearby Drivers
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Sub-second dispatch with Redis Geo engine</p>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. ACTIVE TRIP IN PROGRESS SCREEN */}
            {activeRide ? (
              <div className="mt-4 space-y-4">
                {/* Status Header */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center relative overflow-hidden">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                    Ride Status: {activeRide.status.replace(/_/g, ' ')}
                  </div>

                  {activeRide.status === 'SEARCHING' && (
                    <div className="flex flex-col items-center py-3">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center radar-ping mb-2">
                        <Bike className="w-8 h-8 text-amber-400 animate-pulse" />
                      </div>
                      <p className="text-sm font-semibold text-white">Contacting nearby drivers...</p>
                      <p className="text-xs text-slate-400">Acceptance timeout in 20s</p>
                    </div>
                  )}

                  {activeRide.status === 'ACCEPTED' && (
                    <div className="py-2">
                      <div className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Driver On The Way!
                      </div>
                      <p className="text-xs text-slate-300">Driver is heading to your pickup location</p>
                    </div>
                  )}

                  {activeRide.status === 'ARRIVED_AT_PICKUP' && (
                    <div className="py-2">
                      <div className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
                        📍 Driver Has Arrived!
                      </div>
                      <p className="text-xs text-slate-300">Please board the vehicle and share your OTP</p>
                    </div>
                  )}

                  {activeRide.status === 'IN_TRANSIT' && (
                    <div className="py-2">
                      <div className="text-cyan-400 font-bold text-lg flex items-center justify-center gap-2">
                        🚀 Trip In Progress
                      </div>
                      <p className="text-xs text-slate-300">Navigating to destination: {activeRide.dropoffAddress}</p>
                    </div>
                  )}

                  {activeRide.status === 'COMPLETED' && (
                    <div className="py-2">
                      <div className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
                        🎉 Trip Completed!
                      </div>
                      <p className="text-sm text-slate-200 mt-1">Total Paid: ₹{activeRide.finalFare || activeRide.estimatedFare}</p>
                    </div>
                  )}
                </div>

                {/* OTP Box */}
                {activeRide.status !== 'COMPLETED' && (
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-300 uppercase font-bold tracking-wider">Start Ride OTP</span>
                      <p className="text-2xl font-black text-white tracking-widest">{activeRide.otp}</p>
                    </div>
                    <div className="text-right text-xs text-slate-300 max-w-[150px]">
                      Share this OTP with driver only after boarding
                    </div>
                  </div>
                )}

                {/* Driver Details Card */}
                {activeRide.driverName && (
                  <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-lg shadow">
                          {activeRide.driverName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">{activeRide.driverName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                              {activeRide.driverRating || '4.9'}
                            </span>
                            <span>•</span>
                            <span>{activeRide.vehicleModel || 'Vehicle'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-slate-800 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded font-mono font-bold">
                          {activeRide.vehicleNumber || 'KA-01-AB-1234'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Summary */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
                    <div>
                      <span className="text-slate-400">Pickup:</span> <span className="text-slate-200">{activeRide.pickupAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1" />
                    <div>
                      <span className="text-slate-400">Destination:</span> <span className="text-slate-200">{activeRide.dropoffAddress}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-semibold">
                    <span className="text-slate-400">Estimated Fare:</span>
                    <span className="text-amber-400 text-sm">₹{activeRide.estimatedFare}</span>
                  </div>
                </div>

                {/* Actions */}
                {activeRide.status !== 'COMPLETED' ? (
                  <button
                    onClick={handleCancelRide}
                    className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel Ride
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveRide(null)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition"
                  >
                    Book Another Ride
                  </button>
                )}
              </div>
            ) : (
              /* 2. BOOKING / SEARCH SCREEN */
              <div className="mt-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Map Pin Selector Mode Bar */}
                  <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 pl-2">Map Click:</span>
                    <button
                      type="button"
                      onClick={() => setSelectingFor('pickup')}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition ${
                        selectingFor === 'pickup'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300" />
                      <span>Sets Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectingFor('dropoff')}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition ${
                        selectingFor === 'dropoff'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-200" />
                      <span>Sets Destination</span>
                    </button>
                  </div>

                  {/* Pickup location */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pickup Location
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectingFor('pickup')}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          selectingFor === 'pickup' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {selectingFor === 'pickup' ? '● Ready to click map' : 'Click map to set'}
                      </button>
                    </label>
                    <select
                      value={pickup.name}
                      onChange={(e) => {
                        const loc = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                        if (loc) setPickup(loc);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {PRESET_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                      {!PRESET_LOCATIONS.some((l) => l.name === pickup.name) && (
                        <option value={pickup.name}>{pickup.name}</option>
                      )}
                    </select>
                  </div>

                  {/* Destination location */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> Where to? (Destination)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectingFor('dropoff')}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          selectingFor === 'dropoff' ? 'bg-rose-500/30 border-rose-400 text-rose-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {selectingFor === 'dropoff' ? '● Ready to click map' : 'Click map to set'}
                      </button>
                    </label>
                    <select
                      value={dropoff.name}
                      onChange={(e) => {
                        const loc = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                        if (loc) setDropoff(loc);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      {PRESET_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                      {!PRESET_LOCATIONS.some((l) => l.name === dropoff.name) && (
                        <option value={dropoff.name}>{dropoff.name}</option>
                      )}
                    </select>
                  </div>

                  {/* Route Metric Summary */}
                  {estimate && (
                    <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-sky-400" />
                        <strong>{estimate.distanceKm} km</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <strong>~{estimate.durationMinutes} mins</strong>
                      </span>
                      <span className="text-emerald-400 font-medium">Fastest Route</span>
                    </div>
                  )}

                  {/* Ride Options / Tier Selector */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Vehicle Option</span>

                    <div className="space-y-2">
                      {estimate?.tiers.map((tier) => {
                        const isSelected = selectedTier === tier.vehicleType;
                        return (
                          <div
                            key={tier.vehicleType}
                            onClick={() => setSelectedTier(tier.vehicleType)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                                : 'bg-slate-900/60 border-slate-700/80 hover:bg-slate-900 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                {getVehicleIcon(tier.vehicleType)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white text-sm">{tier.displayName}</h4>
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                    {tier.capacity} {tier.capacity === 1 ? 'seat' : 'seats'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">ETA {tier.etaMinutes} mins away</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-black text-amber-400">₹{tier.fare}</div>
                              {tier.surgeMultiplier > 1.0 && (
                                <span className="text-[10px] text-orange-400 font-medium">⚡ {tier.surgeMultiplier}x Surge</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Book Button */}
                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={handleBookRide}
                    disabled={loading || !estimate}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Calculating Route...</span>
                    ) : (
                      <>
                        <span>Book {selectedTier === 'BIKE' ? 'Rapido Bike' : 'Ride'} Now</span>
                        <span>•</span>
                        <span>
                          ₹{estimate?.tiers.find((t) => t.vehicleType === selectedTier)?.fare || '0'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Map Canvas */}
          <div className="lg:col-span-7 h-full min-h-[400px] flex flex-col gap-2">
            {/* Quick Landmarks Horizontal Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Popular:</span>
              {[
                { name: 'Pari Chowk', lat: 28.4633, lng: 77.5082, emoji: '🚇' },
                { name: 'Expo Mart', lat: 28.4570, lng: 77.5000, emoji: '🏛️' },
                { name: 'Sharda Univ', lat: 28.4725, lng: 77.4833, emoji: '🎓' },
                { name: 'Venice Mall', lat: 28.4529, lng: 77.5260, emoji: '🛍️' },
                { name: 'Alpha 1', lat: 28.4709, lng: 77.5126, emoji: '🏢' },
                { name: 'Gaur City', lat: 28.6054, lng: 77.4281, emoji: '🛍️' },
                { name: 'GBU Campus', lat: 28.4239, lng: 77.5332, emoji: '🎓' },
                { name: 'Yatharth Hosp', lat: 28.4700, lng: 77.4870, emoji: '🏥' },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPlace(p)}
                  className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 px-2.5 py-1 rounded-full text-[11px] text-slate-300 hover:text-white shrink-0 flex items-center gap-1 transition shadow"
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-[380px]">
              <MapComponent
                center={{ lat: pickup.lat, lng: pickup.lng }}
                pickup={pickup}
                dropoff={dropoff}
                driver={
                  activeRide?.driverLat && activeRide?.driverLng
                    ? { lat: activeRide.driverLat, lng: activeRide.driverLng, name: activeRide.driverName, vehicleType: activeRide.vehicleType }
                    : null
                }
                nearbyDrivers={nearbyDrivers}
                routePolyline={estimate?.routePolyline || activeRide?.routePolyline}
                onMapClick={handleMapClick}
                onSelectPlace={handleSelectPlace}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
