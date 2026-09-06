# 🚖 RideSure - Multi-Modal Ride Hailing Platform (Rapido & Uber Clone)

A modern, real-time ride-hailing system built with **Java Spring Boot 3**, **React**, **Google Maps Platform**, **Redis Geospatial**, **PostgreSQL**, and **JWT Authentication**.

---

## 🌟 Key Features

- **Multi-Modal Vehicle Tiers:** Rapido-style Bike Taxis, Auto Rickshaws, Economy Cabs (Mini/Go), and Premium Cabs (Sedan/SUV).
- **Sub-Second Driver Proximity Matching:** Uses **Redis Geospatial** (`GEOADD`, `GEOSEARCH`) to instantly locate the nearest active drivers.
- **Bi-Directional Real-Time Engine:** **Spring WebSocket / STOMP** broker for live driver GPS broadcasting, dispatch radar notifications, and trip state synchronization.
- **Dynamic Fare Engine:** Calculates base fare + per-km + per-minute + dynamic surge pricing multiplier.
- **4-Digit Ride Start OTP:** Verification flow ensuring safe boarding before trip begins.
- **Turn-by-Turn Routing & Polyline:** Powered by **Google Maps Routes API** & `@vis.gl/react-google-maps`.
- **Role-Based Access Control:** Secure JWT authentication supporting `ROLE_RIDER`, `ROLE_DRIVER`, and `ROLE_ADMIN`.

---

## 🏗️ Architecture & Project Structure

```
uber-rapido-platform/
├── backend/                  # Java Spring Boot 3 Backend
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/ridehail/
│       │   ├── config/       # Redis & WebSocket configuration
│       │   ├── controller/   # Auth, Ride, Driver, Admin & Maps REST APIs
│       │   ├── dto/          # Data Transfer Objects
│       │   ├── model/        # User, DriverProfile, Ride, Transaction Entities
│       │   ├── repository/   # Spring Data JPA Repositories
│       │   ├── security/     # JWT Service & Spring Security 6 Filter Chain
│       │   ├── service/      # Dispatch, Fare, Redis Geo, and Routing logic
│       │   └── RideHailApplication.java (with pre-seeded test data)
│       └── main/resources/
│           └── application.yml
│
└── frontend/                 # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/       # RiderView, DriverView, AdminView, MapComponent, Navbar
        ├── context/          # AuthContext with 1-click test account switcher
        ├── services/         # REST API & STOMP WebSocket client
        └── App.jsx
```

---

## 🚀 Quickstart Guide

### 1. Run the Spring Boot Backend

```bash
cd backend
mvn spring-boot:run
```
*The backend starts on `http://localhost:8080` with pre-seeded demo accounts and in-memory resilience for immediate testing.*

### 2. Run the React Frontend

```bash
cd frontend
npm install
npm run dev
```
*The frontend starts on `http://localhost:5173`.*

---

## 🔑 Pre-Seeded Test Accounts

Use the **"⚡ Switch Role"** button in the top navbar for 1-click testing:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Rider** | `rider@test.com` | `password123` | Rahul Sharma (Active booking portal) |
| **Driver (Bike)** | `bike.driver@test.com` | `password123` | Suresh Kumar (Honda Activa 6G - Rapido style) |
| **Driver (Cab)** | `cab.driver@test.com` | `password123` | Amit Patel (Maruti Suzuki WagonR) |
| **Admin** | `admin@test.com` | `password123` | Platform Fleet & Surge Management |

---

## ⚙️ Environment Configuration

### PostgreSQL & Redis (Production)
In `backend/src/main/resources/application.yml` or via environment variables:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ridehaildb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
```

### Google Maps Platform API Key
- **Backend:** Set `GOOGLE_MAPS_API_KEY=your_key` to use Google Maps Routes API for backend distance/duration calculation.
- **Frontend:** Set `VITE_GOOGLE_MAPS_API_KEY=your_key` in `frontend/.env` to use the Google Maps JavaScript API with `@vis.gl/react-google-maps`.
- *(Note: A high-fidelity interactive canvas map is included by default so the entire app is 100% functional out-of-the-box even without an API key).*
