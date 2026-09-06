import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connected = false;
    this.connectionListeners = new Set();
  }

  connect() {
    if (this.client && this.connected) return;

    const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
    const wsEndpoint = rawApiUrl ? `${rawApiUrl}/ws-ride` : '/ws-ride';

    const socketFactory = () => new SockJS(wsEndpoint);

    this.client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        this.connectionListeners.forEach((fn) => fn(true));
        // Resubscribe any pending subscriptions
        this.subscriptions.forEach((sub, topic) => {
          this.subscribe(topic, sub.callback);
        });
      },
      onDisconnect: () => {
        this.connected = false;
        this.connectionListeners.forEach((fn) => fn(false));
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message'], frame.body);
      },
    });

    this.client.activate();
  }

  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    callback(this.connected);
    return () => this.connectionListeners.delete(callback);
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) {
      this.subscriptions.set(topic, { callback, stompSub: null });
      this.connect();
      return () => this.unsubscribe(topic);
    }

    // If already subscribed, unsubscribe first
    const existing = this.subscriptions.get(topic);
    if (existing?.stompSub) {
      existing.stompSub.unsubscribe();
    }

    const stompSub = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (err) {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, { callback, stompSub });

    return () => this.unsubscribe(topic);
  }

  unsubscribe(topic) {
    const sub = this.subscriptions.get(topic);
    if (sub?.stompSub) {
      sub.stompSub.unsubscribe();
    }
    this.subscriptions.delete(topic);
  }

  send(destination, body) {
    if (this.client && this.connected) {
      this.client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    }
  }

  sendDriverLocation(driverId, lat, lng, heading = 0, vehicleType = 'BIKE') {
    this.send('/app/driver/location', {
      driverId,
      lat,
      lng,
      heading,
      vehicleType,
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const wsService = new WebSocketService();
