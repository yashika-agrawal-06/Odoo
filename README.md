# TransitOps — Smart Transport Operations Platform

TransitOps is a modern, responsive fleet management, trip dispatcher, and transit analytics platform built with React, Vite, Express, Drizzle ORM, and Better-Auth. It features a robust **Role-Based Access Control (RBAC)** permission matrix system to govern access to transport resources.

---

## 🚀 Tech Stack

### Frontend (Client)
- **Core:** React 19 + Vite
- **Routing:** React Router v6
- **Styling:** TailwindCSS + CSS variables (`index.css`)
- **Components:** Prebuilt shadcn UI wrappers (`Dialog`, `Switch`, `Select`, `Table`, `Progress`, `Card`, `Badge`)
- **Charts:** Recharts (bound to theme CSS variables)

### Backend (Server)
- **Core:** Express 5
- **ORM:** Drizzle ORM (Postgres Dialect)
- **Database:** PostgreSQL (NeonDB serverless cloud database)
- **Authentication:** Better-Auth (with PostgreSQL adapter)

---

## 🛠️ Key Features

1. **Dynamic RBAC Security Matrix:**
   - Permissions are checked on every route transition via a client-side wrapper (`ProtectedRoute.jsx`) and validated at the API level via Express middleware (`requirePermission.js`).
   - Includes a graphical permissions matrix inside the Settings view using toggle switches with green ticks and red crosses.
2. **Trip Dispatcher & Cascading State Rules:**
   - Validates that cargo weight does not exceed the vehicle's capacity.
   - Validates driver eligibility (rejects suspended drivers or expired licenses).
   - Automatically transition status: Dispatching moves both vehicle and driver to `on_trip`. Completion or cancellation resets them back to `available` and updates vehicle odometer logs.
3. **Vehicle Registry & Maintenance Tracker:**
   - Track fleet logs and status. Putting a vehicle in the maintenance shop changes status to `in_shop`. Releasing it changes it back to `available`.
4. **Finance Tracker (Cost Logger):**
   - Logs fuel refills and travel expenses (e.g. tolls) linked optional to active trips.
5. **Insights Dashboard & ROI Analytics:**
   - Real-time KPI summaries (Fleet utilization, active drivers/vehicles, costs).
   - Generates CSV spreadsheet reports and calculates per-vehicle ROI on the fly.
6. **Unified Better-Auth Client:**
   - Supports sign-ins and sign-ups with dynamic, demo role selectors that map automatically to DB instances.

---

## 📂 Project Structure

```
├── frontend/                   # Frontend React Application
│   ├── src/
│   │   ├── components/         # Common UI Components & Layouts
│   │   │   ├── ui/             # Prebuilt shadcn UI wrappers
│   │   │   ├── app-sidebar.jsx # Dynamic Navigation Sidebar
│   │   │   └── login-form.jsx  # Auth Login/Signup Panels
│   │   ├── context/            # Global PermissionsContext
│   │   ├── lib/                # better-auth client wrappers & utilities
│   │   ├── pages/              # Platform Pages (Dashboard, Fleet, Settings...)
│   │   ├── routes/             # ProtectedRoute wrapper
│   │   └── App.jsx             # Entrypoint / Layout Wrapper
│   └── package.json
│
├── server/                     # Backend Express Server
│   ├── src/
│   │   ├── db/                 # Database Config, Schema, & Seeder
│   │   │   ├── schema/         # Drizzle Schema Definitions
│   │   │   └── seed.js         # Seeding Script
│   │   ├── middleware/         # requireAuth & requirePermission hooks
│   │   ├── modules/            # Backend Modules (Trips, Vehicles, Analytics...)
│   │   ├── auth.js             # Better-Auth Backend Adapter Config
│   │   └── index.js            # Express Entrypoint
│   └── package.json
```

---

## ⚙️ Environment Configurations

### 1. Backend Config (`server/.env`)
Create a file named `.env` in the `/server` directory and paste your configuration:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
BETTER_AUTH_SECRET=your-auth-secret-key-32-chars
BETTER_AUTH_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### 2. Frontend Config (`frontend/.env.local` or inline)
Make sure the client communicates with the server running at `http://localhost:8000`.

---

## 🛫 Quick Start Guide

### Step 1: Install Dependencies
Install packages in the root, server, and frontend directories:
```bash
# In root workspace
npm install

# In server
cd server
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Database Schema & Seeding
Push the database schema structures using Drizzle Kit, then populate the defaults and mock data using the custom seed script:
```bash
# Run from /server directory
npx drizzle-kit push
node src/db/seed.js
```
*Note: The seeder loads regions, mock vehicles, active drivers, and configures the default RBAC permission matrix for the default 4 roles: `admin`, `dispatcher`, `manager`, and `driver`.*

### Step 3: Run Dev Servers
Start the backend and frontend dev servers:
```bash
# Start Express Server (port 8000)
cd server
npm run dev

# Start Frontend Client (port 5173)
cd ../frontend
npm run dev
```

---

## 🛡️ RBAC Permissions Matrix Configuration

| Role / Resource | Vehicles | Drivers | Trips | Maintenance | Fuel & Expenses | Settings |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Full | Full | Full | Full | Full | Full |
| **Dispatcher** | View | View | Full | View | View | None |
| **Manager** | Full | Full | View | Full | Full | None |
| **Driver** | View | View | View | None | View | None |

---

## 🛡️ Code Guidelines & Formatting
This project uses **Ultracite** and **Biome** to enforce formatting, styling conventions, and linting.

- **Check Issues:** `npm exec -- ultracite check`
- **Auto Fix Issues:** `npm exec -- ultracite fix`
