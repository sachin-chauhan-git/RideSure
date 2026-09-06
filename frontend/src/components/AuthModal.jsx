import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, Bike, Car } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('ROLE_RIDER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    vehicleModel: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ ...formData, role });
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">
          {isRegister ? 'Create RideSure Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          {isRegister ? 'Sign up as a Rider or Driver Partner' : 'Sign in to manage your rides and fleet'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <>
              {/* Role Picker */}
              <div className="grid grid-cols-2 gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_RIDER')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    role === 'ROLE_RIDER'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  👤 Rider Account
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ROLE_DRIVER')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    role === 'ROLE_DRIVER'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  🏍️ Driver Partner
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Phone Number</label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Driver specific info */}
              {role === 'ROLE_DRIVER' && (
                <div className="space-y-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-[11px] font-bold uppercase text-amber-400">Vehicle Details</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Type</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      >
                        <option value="BIKE">Bike (Rapido)</option>
                        <option value="AUTO">Auto Rickshaw</option>
                        <option value="CAB_ECONOMY">Economy Cab</option>
                        <option value="CAB_PREMIUM">Premium Cab</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Plate Number</label>
                      <input
                        type="text"
                        required
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        placeholder="KA-01-AB-1234"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-amber-400 transition"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
