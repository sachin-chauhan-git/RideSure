import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { MapComponent } from './MapComponent';
import { SubscriptionDriverTab } from './SubscriptionDriverTab';
import { Power, Navigation, Phone, ShieldCheck, Check, X, AlertTriangle, Bike, Car, DollarSign, Award, Briefcase, Radio } from 'lucide-react';

export const DriverView = ({ user }) => {
  const [driverMode, setDriverMode] = useState('ondemand'); // 'ondemand' or 'subscription'
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: 28.4744, lng: 77.5040 });
  const [activeRide, setActiveRide] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [countdown, setCountdown] = useState(20);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize driver profile & check active rides
  useEffect(() => {
    fetchProfile();
    fetchActiveRide();
  }, []);

  // Listen to WebSocket dispatches
  useEffect(() => {
    if (!profile?.userId) return;

    // Direct dispatches to this driver
    const unsubDirect = wsService.subscribe(`/topic/driver/${profile.userId}/requests`, (rideReq) => {
      console.log('Incoming Ride Request for this driver:', rideReq);
      if (!activeRide) {
        setIncomingRequest(rideReq);
        setCountdown(20);
      }
    });

    // Broadcast dispatches for this vehicle type
    const unsubBroadcast = wsService.subscribe(`/topic/dispatches/${profile.vehicleType}`, (rideReq) => {
      console.log('Broadcast Ride Dispatch:', rideReq);
      if (!activeRide && !incomingRequest) {
        setIncomingRequest(rideReq);
        setCountdown(20);
      }
    });

    // Scheduled Commute Dispatches
    const unsubCommute = wsService.subscribe(`/topic/driver/${profile.userId}/commute-dispatched`, () => {
      fetchActiveRide();
    });

    // Listen to status updates on current active ride
    let unsubRide = null;
    if (activeRide?.id) {
      unsubRide = wsService.subscribe(`/topic/ride/${activeRide.id}`, (updatedRide) => {
        setActiveRide(updatedRide);
      });
    }

    return () => {
      unsubDirect && unsubDirect();
      unsubBroadcast && unsubBroadcast();
      unsubCommute && unsubCommute();
      unsubRide && unsubRide();
    };
  }, [profile?.userId, profile?.vehicleType, activeRide?.id, incomingRequest]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!incomingRequest) return;
    if (countdown <= 0) {
      setIncomingRequest(null);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [incomingRequest, countdown]);

  // Continuous GPS beaconing while online
  useEffect(() => {
    if (!isOnline || !profile?.userId) return;

    const beacon = setInterval(() => {
      // Slight GPS jitter/movement simulation
      setCurrentCoords((prev) => {
        const next = {
          lat: prev.lat + (Math.random() - 0.5) * 0.0004,
          lng: prev.lng + (Math.random() - 0.5) * 0.0004,
        };
        wsService.sendDriverLocation(profile.userId, next.lat, next.lng, 90, profile.vehicleType);
        return next;
      });
    }, 4000);

    return () => clearInterval(beacon);
  }, [isOnline, profile?.userId, profile?.vehicleType]);

  const fetchProfile = async () => {
    try {
      const data = await api.getDriverProfile();
      setProfile(data);
      setIsOnline(data.online);
      if (data.currentLat && data.currentLng) {
        setCurrentCoords({ lat: data.currentLat, lng: data.currentLng });
      }
    } catch (err) {
      console.error('Error fetching driver profile', err);
    }
  };

  const fetchActiveRide = async () => {
    try {
      const ride = await api.getDriverActiveRide();
      if (ride) {
        setActiveRide(ride);
      }
    } catch (err) {
      console.error('Error fetching driver active ride', err);
    }
  };

  const toggleOnline = async () => {
    setLoading(true);
    try {
      const nextStatus = !isOnline;
      const updated = await api.toggleDriverStatus(nextStatus, currentCoords.lat, currentCoords.lng);
      setIsOnline(updated.online);
      setProfile(updated);
    } catch (err) {
      console.error('Failed to toggle driver status');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async () => {
    if (!incomingRequest) return;
    setLoading(true);
    try {
      const ride = await api.acceptRide(incomingRequest.id);
      setActiveRide(ride);
      setIncomingRequest(null);
    } catch (err) {
      alert(err.message || 'Ride already taken');
      setIncomingRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRide = () => {
    setIncomingRequest(null);
  };

  const handleMarkArrived = async () => {
    if (!activeRide) return;
    try {
      const updated = await api.markArrived(activeRide.id);
      setActiveRide(updated);
    } catch (err) {
      alert('Failed to update arrival status');
    }
  };

  const handleStartRide = async () => {
    if (!activeRide || !otpInput.trim()) return;
    setOtpError('');
    try {
      const updated = await api.startRide(activeRide.id, otpInput.trim());
      setActiveRide(updated);
      setOtpInput('');
    } catch (err) {
      setOtpError(err.message || 'Invalid OTP');
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      const updated = await api.completeRide(activeRide.id);
      setActiveRide(updated);
      fetchProfile();
    } catch (err) {
      alert('Failed to complete ride');
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDriverMode('ondemand')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              driverMode === 'ondemand'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>⚡ Live On-Demand Radar</span>
          </button>

          <button
            onClick={() => setDriverMode('subscription')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              driverMode === 'subscription'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>💼 Commute Marketplace (Guaranteed Income)</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Commute Contracts Marketplace */}
      {driverMode === 'subscription' && <SubscriptionDriverTab />}

      {/* Mode 2: Live On-Demand Radar */}
      {driverMode === 'ondemand' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
          {/* Left Driver Console Panel */}
          <div className="lg:col-span-5 flex flex-col bg-slate-800/95 backdrop-blur rounded-2xl p-5 border border-slate-700/80 shadow-2xl overflow-y-auto">
            {/* Driver Profile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow">
                  {profile?.driverName?.[0] || 'D'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{profile?.driverName || 'Driver Partner'}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      ★ {profile?.ratingAvg?.toFixed(1) || '5.0'}
                    </span>
                    <span>•</span>
                    <span>{profile?.vehicleNumber || 'Vehicle'}</span>
                  </div>
                </div>
              </div>

              {/* Online Toggle Button */}
              <button
                onClick={toggleOnline}
                disabled={loading || !!activeRide}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                  isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                } disabled:opacity-50`}
              >
                <Power className="w-4 h-4" />
                <span>{isOnline ? 'ONLINE' : 'GO ONLINE'}</span>
              </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Vehicle</span>
                <p className="text-xs font-bold text-white truncate">{profile?.vehicleType || 'BIKE'}</p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Trips</span>
                <p className="text-sm font-black text-amber-400">{profile?.totalTrips || 0}</p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Earnings</span>
                <p className="text-sm font-black text-emerald-400">₹{((profile?.totalTrips || 0) * 140).toFixed(0)}</p>
              </div>
            </div>

            {/* 1. INCOMING DISPATCH POPUP (RADAR ALERT) */}
            {incomingRequest && (
              <div className="bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-2 border-amber-400 rounded-2xl p-5 shadow-2xl my-2 animate-bounce-short">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                    ⚡ New Ride Request!
                  </span>
                  <span className="text-base font-black text-amber-400">{countdown}s</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-1000"
                    style={{ width: `${(countdown / 20) * 100}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400">Guaranteed Fare:</span>
                    <span className="text-lg font-black text-emerald-400">₹{incomingRequest.estimatedFare}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 space-y-1">
                    <p className="text-slate-300">
                      <strong className="text-emerald-400">Pickup:</strong> {incomingRequest.pickupAddress}
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-rose-400">Drop:</strong> {incomingRequest.dropoffAddress}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Distance: {incomingRequest.distanceKm} km • Est. {incomingRequest.durationMinutes} mins
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDeclineRide}
                    className="py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                  <button
                    onClick={handleAcceptRide}
                    className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                  >
                    <Check className="w-5 h-5" /> Accept Ride
                  </button>
                </div>
              </div>
            )}

            {/* 2. ACTIVE TRIP NAVIGATION AND CONTROL */}
            {activeRide ? (
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs uppercase font-bold text-amber-400 mb-1">
                    Trip In Progress: {activeRide.status.replace(/_/g, ' ')}
                  </div>
                  <h3 className="text-base font-bold text-white">{activeRide.riderName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {activeRide.riderPhone || '+91 9876543210'}
                  </p>
                </div>

                {/* Step 1: Headed to pickup */}
                {activeRide.status === 'ACCEPTED' && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-emerald-400">Head to Pickup:</span> {activeRide.pickupAddress}
                    </div>
                    <button
                      onClick={handleMarkArrived}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow transition"
                    >
                      📍 I Have Arrived at Pickup
                    </button>
                  </div>
                )}

                {/* Step 2: Arrived - Enter OTP */}
                {activeRide.status === 'ARRIVED_AT_PICKUP' && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/50 space-y-3">
                    <div className="text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Enter Rider's OTP</span>
                      <p className="text-xs text-slate-400 mt-1">Ask the rider for the 4-digit start OTP</p>
                    </div>

                    <div className="flex justify-center">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="e.g. 1234"
                        className="w-40 text-center tracking-widest text-2xl font-black bg-slate-950 border border-slate-600 rounded-xl py-2 text-amber-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {otpError && <p className="text-xs text-rose-400 text-center font-medium">{otpError}</p>}

                    <button
                      onClick={handleStartRide}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow transition"
                    >
                      🚀 Verify OTP & Start Trip
                    </button>
                  </div>
                )}

                {/* Step 3: In Transit - Dropoff Navigation */}
                {activeRide.status === 'IN_TRANSIT' && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-rose-400">Navigating to Dropoff:</span> {activeRide.dropoffAddress}
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 py-1">
                      <span>Fare to collect:</span>
                      <span className="text-base font-bold text-emerald-400">₹{activeRide.estimatedFare} (Auto-settled / Cash)</span>
                    </div>
                    <button
                      onClick={handleCompleteRide}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow transition"
                    >
                      🏁 End Trip & Collect Payment
                    </button>
                  </div>
                )}

                {/* Step 4: Completed */}
                {activeRide.status === 'COMPLETED' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                    <h4 className="text-base font-bold text-emerald-400">🎉 Trip Completed Successfully!</h4>
                    <p className="text-xs text-slate-300">
                      Fare Credited: <strong className="text-white text-sm">₹{activeRide.finalFare || activeRide.estimatedFare}</strong>
                    </p>
                    <button
                      onClick={() => setActiveRide(null)}
                      className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl"
                    >
                      Back to Online Radar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Idle Status Radar */
              <div className="mt-8 flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                {isOnline ? (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center radar-ping mb-4">
                      <Navigation className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-bold text-white">Searching for Nearby Rides</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      You are Online. As soon as a rider books a trip near you, the dispatch radar will ring!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                      <Power className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-300">You are currently Offline</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Click 'GO ONLINE' in the top right to start receiving ride requests.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Map */}
          <div className="lg:col-span-7 h-full min-h-[400px]">
            <MapComponent
              center={currentCoords}
              driver={{ lat: currentCoords.lat, lng: currentCoords.lng, name: profile?.driverName, vehicleType: profile?.vehicleType }}
              pickup={activeRide ? { lat: activeRide.pickupLat, lng: activeRide.pickupLng } : null}
              dropoff={activeRide ? { lat: activeRide.dropoffLat, lng: activeRide.dropoffLng } : null}
              routePolyline={activeRide?.routePolyline}
            />
          </div>
        </div>
      )}
    </div>
  );
};
