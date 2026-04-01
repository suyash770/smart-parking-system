# 🏎️ Smart Parking System

A modern, high-fidelity 3D Web Application for full-stack parking lot management. Built using cutting-edge "Dark Metallic" / Neumorphic UI design principles with a powerful MongoDB and Socket.io backed backend.

## ✨ Key Features

- **3D Hardware UI:** Immersive neumorphic dashboard, interactive "hardware" toggles, and metallic glassmorphism interfaces using pure CSS and React.
- **Real-Time Synchronization:** Seamless, zero-latency parking slot updates powered by WebSockets (`Socket.io`) across all concurrent clients.
- **Smart Allocation Engine:** Algorithmic slot assignment built on **Min-Heaps (O(log n))** ensuring the closest available slot is instantly allocated during peak hours.
- **Dynamic Surge Pricing:** Intelligent algorithm that automatically scales hourly rates based on the current building occupancy percentages.
- **Advanced Lot Analytics:** Interactive live charts via `recharts` to monitor hourly turnover, revenue, vehicle flow, and capacity.
- **Zone Filtering:** Modular zone allocations dividing the lot into categories: Two-Wheelers, Cars/SUVs, and Heavy Trucks.

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- React Router DOM
- Tailwind CSS / Vanilla Custom CSS properties
- Recharts (Data Visualizations)
- Socket.io-client

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- Socket.io (WebSocket Servers)
- JWT Authentication

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- MongoDB running locally or pointing to an Atlas URI.

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

### 3. Server Setup
```bash
cd server
npm install
# Set your environment variables first in a .env file (e.g. PORT=5000)
npm run start
```

## 🗺️ Interface Walkthrough

1. **SmartPark Landing Command Console:** The initial entry screen featuring hardware-inspired aesthetics.
2. **Dashboard Floor Selector:** Toggle between various building floors to view available parking bays.
3. **Analytics Modal:** A rich data suite for administrative oversight, visualizing average parking durations and generated revenue.

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page.
