# Abhishek Boys Hostel — Management System

A modern, production-grade hostel management web application built with Next.js 14, TypeScript, Tailwind CSS, and Prisma ORM.

---

## 🌟 Key Features

### 🛡️ Dual-Role Authentication & Security
- **Admin Portal (`/login?portal=admin`)**: Full access to hostel management, financial ledgers, and resident allocation.
- **Student Portal (`/login?portal=student`)**: Dedicated resident portal for rooms, payments, notices, and complaints.
- **Role Enforcement**: Server-side Edge Middleware strictly blocks unauthorized access (returns HTTP 403 Forbidden for students accessing admin endpoints).

### 🏨 Room & Bed Management
- Visual interactive bed maps with real-time occupancy tracking.
- Automated bed assignment upon resident registration.
- Prevents double-booking of any bed.

### 💳 Dynamic Fee Payment System
- **Admin Configurable Payment Gateway**: Manage UPI ID (VPA), payment phone number, beneficiary name, QR code, and instructions from `Settings → Fee Payment Settings`.
- **Dynamic Display for Students**: Always loads live credentials from the database with one-click copy buttons and QR code modal.
- **Proof of Payment**: Students upload transaction receipts; admins verify and approve in real-time.

### 📢 Hostel Notices & Automated Alerts
- Category & Priority badges (`URGENT`, `IMPORTANT`, `NORMAL`).
- Urgent and Important notices automatically dispatch alerts to resident notification bells.
- Top notices showcased on the resident dashboard with a full reader modal.

### 👤 Student Profile & Photo Upload
- Circular avatar upload supporting JPG, PNG, and WebP up to 5MB.
- Comprehensive personal, academic, hostel room, and guardian emergency contact details.

### 🛠️ Maintenance Complaints & Mess Menu
- Ticket logging with status progression (`PENDING` → `IN_PROGRESS` → `RESOLVED`).
- Weekly meal roster with daily highlights.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or later
- npm or yarn

### 2. Installation
```bash
git clone <your-repository-url>
cd "Abhishek Boys hostel"
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
```bash
npx prisma db push
node prisma/seed.js
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
npm run start
```

---

## 🌐 Deployment Guidelines

### Option A: Deploy on Vercel
1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the required Environment Variables (`AUTH_SECRET`, etc.).
4. For persistent storage in serverless environments, connect Prisma to a PostgreSQL/MySQL database (e.g., Supabase, Neon, PlanetScale) or use SQLite on a persistent disk.

### Option B: Deploy on VPS / Render / Railway
1. Clone the repository on your server.
2. Configure `.env`.
3. Run `npm install`, `npx prisma db push`, `npm run build`, and `npm run start` (or use PM2/Docker).

---

## 📄 License
Private & Proprietary — Abhishek Boys Hostel Management System.
