const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const API_BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

export const getAuthToken = () => localStorage.getItem('ridehail_token');
export const setAuthToken = (token) => localStorage.setItem('ridehail_token', token);
export const removeAuthToken = () => localStorage.removeItem('ridehail_token');

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Wallet
  getWalletBalance: () => request('/wallet/balance'),
  topupWallet: (amount, paymentMethod = 'UPI') => request('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount, paymentMethod }) }),
  getWalletTransactions: () => request('/wallet/transactions'),

  // Subscriptions (Recurring Commutes)
  estimateSubscription: (data) => request('/subscriptions/estimate', { method: 'POST', body: JSON.stringify(data) }),
  createSubscription: (data) => request('/subscriptions/create', { method: 'POST', body: JSON.stringify(data) }),
  getMyRiderSubscriptions: () => request('/subscriptions/rider/my'),
  getDriverMarketplace: () => request('/subscriptions/driver/marketplace'),
  getMyDriverSubscriptions: () => request('/subscriptions/driver/my'),
  acceptSubscription: (id) => request(`/subscriptions/${id}/accept`, { method: 'POST' }),
  simulateDailyDispatch: (id) => request(`/subscriptions/${id}/simulate-dispatch`, { method: 'POST' }),
  cancelSubscription: (id) => request(`/subscriptions/${id}/cancel`, { method: 'POST' }),
  getAllSubscriptions: () => request('/subscriptions/all'),

  // On-demand Rides (Rider)
  estimateFare: (coords) => request('/rides/estimate', { method: 'POST', body: JSON.stringify(coords) }),
  requestRide: (rideData) => request('/rides/request', { method: 'POST', body: JSON.stringify(rideData) }),
  getActiveRide: () => request('/rides/active'),
  getRideById: (id) => request(`/rides/${id}`),
  cancelRide: (id, reason) => request(`/rides/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' }),
  getNearbyDrivers: (lat, lng, radiusKm = 10, vehicleType) => {
    let url = `/rides/nearby-drivers?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`;
    if (vehicleType) url += `&vehicleType=${vehicleType}`;
    return request(url);
  },

  // Driver
  getDriverProfile: () => request('/drivers/me'),
  toggleDriverStatus: (online, lat, lng) => {
    let url = `/drivers/status?online=${online}`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    return request(url, { method: 'POST' });
  },
  updateDriverLocation: (locationDto) => request('/drivers/location', { method: 'POST', body: JSON.stringify(locationDto) }),
  getDriverActiveRide: () => request('/drivers/active-ride'),
  acceptRide: (rideId) => request(`/drivers/rides/${rideId}/accept`, { method: 'POST' }),
  markArrived: (rideId) => request(`/drivers/rides/${rideId}/arrived`, { method: 'POST' }),
  startRide: (rideId, otp) => request(`/drivers/rides/${rideId}/start?otp=${encodeURIComponent(otp)}`, { method: 'POST' }),
  completeRide: (rideId) => request(`/drivers/rides/${rideId}/complete`, { method: 'POST' }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAllDrivers: () => request('/admin/drivers'),
  getAllRides: () => request('/admin/rides'),
  setSurgeMultiplier: (multiplier) => request(`/admin/surge?multiplier=${multiplier}`, { method: 'POST' }),

  // Maps proxy
  getRoute: (originLat, originLng, destLat, destLng) =>
    request(`/maps/route?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`),
};
