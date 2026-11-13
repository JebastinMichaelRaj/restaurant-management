# 🍽️ Restaurant Management System (Advanced)

A full-stack Restaurant Management System with customer ordering, table
reservations, a real-time kitchen dashboard, billing, inventory management,
and an admin dashboard — built with Node.js, Express, MongoDB, Socket.IO,
JWT authentication, and a vanilla HTML/CSS/JS frontend.

## ✨ Features implemented

- 👤 **Authentication** — Register/login with JWT + bcrypt password hashing,
  role-based access control (`admin`, `chef`, `waiter`, `customer`)
- 🍽️ **Menu management** — CRUD for dishes, search & category filtering
- 🪑 **Table reservations** — Real-time availability, **double-booking
  prevented at the database level** via a unique compound index
- 🛒 **Food ordering** — Cart, customization notes, order placement
- 👨‍🍳 **Kitchen dashboard** — Orders appear **instantly** via Socket.IO,
  status flow: Pending → Preparing → Ready → Served
- 💳 **Billing & payments** — Auto-calculated GST, service charge,
  discounts, grand total; Stripe PaymentIntent endpoint included
- 📦 **Inventory management** — Stock levels, suppliers, reorder
  thresholds; **stock automatically deducts when an order is served**,
  and a low-stock event is broadcast in real time
- 📊 **Admin dashboard** — Daily sales, popular dishes, staff management,
  menu & inventory management, business stats
- 🔔 **Real-time notifications** — New orders, status changes, low stock,
  and new reservations all push live to connected clients via Socket.IO

## 📂 Project Structure

```
restaurant-management/
├── client/                 # Vanilla HTML/CSS/JS frontend
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js          # fetch wrapper + API base URL
│   │   ├── auth.js         # auth/session/nav helpers
│   │   └── socket-client.js
│   ├── index.html          # Login / Register
│   ├── menu.html           # Browse menu, add to cart
│   ├── reservation.html    # Table reservation
│   ├── cart.html           # Cart, checkout, order history, billing
│   ├── kitchen.html        # Real-time kitchen dashboard
│   └── admin.html          # Admin dashboard
│
├── server/                 # Express + MongoDB backend
│   ├── routes/              (auth, menu, tables, orders, inventory, admin, payments)
│   ├── controllers/
│   ├── models/               (User, Food, Table, Reservation, Order, Inventory)
│   ├── middleware/           (JWT auth, role authorization, error handler)
│   ├── socket/socketHandler.js
│   ├── server.js
│   ├── seed.js              # optional demo data loader
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance — either local (`mongodb://127.0.0.1:27017`) or a
  free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and optionally STRIPE_SECRET_KEY
npm run dev        # starts on http://localhost:5000 (uses nodemon)
# or: npm start
```

Optional — load demo data (admin/chef/waiter/customer accounts, sample
menu, tables, and inventory):
```bash
node seed.js
```
Demo accounts (password for all: `password123`):
- `admin@restaurant.com`
- `chef@restaurant.com`
- `waiter@restaurant.com`
- `customer@restaurant.com`

### 3. Frontend setup
The frontend is plain HTML/CSS/JS — no build step required. Serve the
`client/` folder with any static server, e.g.:
```bash
cd client
npx serve -l 5500
# or use the VS Code "Live Server" extension
```
Then open `http://localhost:5500`.

> The frontend calls the API at `http://localhost:5000/api` (see
> `client/js/api.js`) and connects to Socket.IO at `http://localhost:5000`
> (see `client/js/socket-client.js`). Update those constants if you deploy
> the backend elsewhere.

## 🌐 Deployment (as referenced in the brief)
- **Frontend** → GitHub Pages (or any static host) — just push the
  `client/` folder and update `API_BASE`/socket URL to your backend's URL
- **Backend** → Render (or Railway/Fly.io) — set the environment variables
  from `.env.example` in your host's dashboard
- **Database** → MongoDB Atlas — put the connection string in `MONGO_URI`

## 🔑 Key design decisions

- **Double-booking prevention**: `Reservation` has a unique partial index
  on `(table, date, timeSlot)` scoped to `status: 'confirmed'`, so MongoDB
  itself rejects a conflicting booking even under concurrent requests —
  not just an application-level check.
- **Real-time kitchen dashboard**: every order-affecting action
  (`order:new`, `order:statusUpdated`, `order:paid`, `inventory:low`,
  `reservation:created`) is emitted over Socket.IO from the relevant
  controller via `req.io`, so every connected screen updates instantly.
- **Automatic inventory deduction**: each `Food` document can reference
  `Inventory` ingredients with a quantity used per serving. When an order
  is marked `served`, stock is deducted automatically and a `inventory:low`
  event fires if any ingredient drops below its reorder threshold.
- **Billing**: `orderController.calculateBill()` computes subtotal, 5% GST,
  10% service charge, and an optional discount percentage server-side, so
  totals can't be tampered with from the client.

## 🌟 Suggested next steps (bonus features from the brief)
Dark mode, QR-code menus, AI recommendations, self-service kiosk mode,
delivery tracking, loyalty rewards, and push notifications are natural
extensions of this codebase — the Socket.IO event bus and role-based
architecture are already in place to support them.
