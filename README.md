# RescueBite — Food Rescue & Surplus Redistribution Network

RescueBite is an end-term-ready full-stack MERN web application connecting food donors (restaurants, bakeries, caterers, grocers), recipient non-profits (shelters, food banks, community pantries), volunteers, and platform administrators to eliminate edible food waste and combat urban hunger across India.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 19, Vite, JavaScript, Tailwind CSS, Leaflet + OpenStreetMap (India Map), Recharts, Socket.IO Client.
- **Backend**: Node.js, Express.js (v5), Socket.IO, Mongoose (v9), Helmet, CORS, Cookie-Parser, Rate-Limiting.
- **Database**: MongoDB Atlas with native GeoJSON `2dsphere` spatial indexing.
- **Authentication**: JWT stored in secure `HttpOnly`, `SameSite` cookies with bcrypt password hashing and RBAC.
- **Real-Time Engine**: Authenticated Socket.IO rooms (`user:<id>`, `role:<role>`, `listing:<id>`).
- **Testing**: Vitest with Supertest and isolated MongoDB Memory Server.
- **API Documentation**: OpenAPI / Swagger 3.0 at `/api/docs`.
- **Deployment**: Pure standard Node.js & npm scripts (**Zero Docker, zero containers, zero Kubernetes required**).

---

## 2. Directory Structure

```text
RescueBite/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI, India Leaflet Map, FoodCards, Badges
│   │   ├── context/            # AuthContext (Real JWT session), DataContext
│   │   ├── pages/              # Role-partitioned portals (Donor, Recipient, Volunteer, Admin)
│   │   ├── services/           # Api client configured with credentials: 'include'
│   │   ├── App.jsx             # React Router with ProtectedRoute role guards
│   │   └── main.jsx
│   ├── .env.example            # Client env template
│   └── package.json
│
├── server/                     # Node.js + Express REST API
│   ├── seeds/
│   │   └── seedDemoIndia.js    # Safe, non-destructive idempotent Indian demo seeder
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection, env validation
│   │   ├── constants/          # Roles, food categories, units, storage types
│   │   ├── controllers/        # Auth, Listing, Reservation, Task, Admin, Analytics
│   │   ├── middleware/         # Auth, RBAC, error handling, rate limiter
│   │   ├── models/             # User, Organization, FoodListing, Reservation, PickupTask, Report, AuditLog
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # Atomic matching, state machines, expiry worker
│   │   ├── sockets/            # Authenticated Socket.IO gateway
│   │   └── utils/              # Cryptographic code hasher (SHA-256), audit logger
│   ├── tests/                  # 55 passing Vitest tests
│   ├── swagger.yaml            # OpenAPI 3.0 specification
│   ├── .env.example            # Server env template
│   └── package.json
└── README.md
```

---

## 3. Quick Start & Local Setup (Without Docker)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- A free MongoDB Atlas cluster (or local MongoDB)

### Step 1: Backend Setup
```bash
cd server
npm install

# Copy environment template
cp .env.example .env
```

Configure your `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
MONGODB_DB_NAME=rescuebite
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=1d
COOKIE_SECURE=false
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```
The server will validate environment variables at startup and connect to MongoDB Atlas.
- API Base URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`
- Swagger Docs: `http://localhost:5000/api/docs`

### Step 2: Seed Synthetic Demo Data (India Hubs)
To seed realistic, non-destructive demonstration records into your Atlas database:
```bash
cd server
npm run seed:demo
```
> **Safety Guarantee**: The seeder uses an upsert strategy (`findOneAndUpdate`). It **never** drops collections or deletes existing non-demo records. Every seeded document is tagged with `isDemo: true`.

### Step 3: Frontend Setup
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
The client will start at `http://localhost:5173`.

---

## 4. Demo Accounts & Credentials

All demo accounts are seeded with password: `DemoPassword123!`

| Role | Name | Email | City | Organization |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | Chef Rajesh Khanna | `rajesh.mumbai@demo-rescuebite.org` | Mumbai | Bandra Artisanal Bakery |
| **Donor** | Simran Walia | `simran.delhi@demo-rescuebite.org` | Delhi | Connaught Place Community Kitchen |
| **Recipient** | Sunita Patil | `sunita.seva@demo-rescuebite.org` | Mumbai | Seva Food Relief Foundation (NGO) |
| **Recipient** | Arjun Mehra | `arjun.robin@demo-rescuebite.org` | Delhi | Robin Compassion Food Network (NGO) |
| **Volunteer** | Rohan Sharma | `rohan.volunteer@demo-rescuebite.org` | Mumbai | Independent Courier |
| **Volunteer** | Priya Nair | `priya.volunteer@demo-rescuebite.org` | Bengaluru | Bicycle Volunteer |
| **Admin** | Platform SuperAdmin | `superadmin@rescuebite.org` | System | RescueBite Security Team |

---

## 5. Security & Authorization Matrix

RescueBite enforces multi-layered server-side security. Frontend route guards redirect unauthenticated users to `/login` (preserving the requested destination) while the Express server acts as the authoritative security boundary:

| Endpoint | Method | Allowed Roles | Permission Gate & Security Checks |
| :--- | :---: | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Validates email, password strength, and role. Admin registration is prohibited. |
| `/api/auth/login` | `POST` | Public | Rate-limited (10 req/15m). Verifies hash. Rejects suspended accounts with 403. Issues HttpOnly JWT cookie. |
| `/api/auth/logout` | `POST` | Public | Clears session cookie. |
| `/api/auth/me` | `GET` | Authenticated | Returns authenticated user session and linked organization verification status. |
| `/api/listings` | `GET` | Public | Spatial discovery using GeoJSON `2dsphere` `$near` query. Filters by category and pickup window. |
| `/api/listings` | `POST` | `donor` | Validates food safety metadata, pickup window, and GeoJSON coordinates. Audit logged. |
| `/api/listings/:id` | `PUT` / `DELETE` | `donor` (owner), `admin` | Resource ownership check: donors cannot modify or withdraw another donor's surplus. |
| `/api/reservations` | `POST` | `recipient` (verified) | Atomic conditional inventory decrement (`$gte`). Rejects unverified recipient NGOs with 403. Idempotent key protection against network retries. |
| `/api/reservations/:id/approve` | `PATCH` | `donor` (owner), `admin` | Donor confirms claim and generates short-lived pickup verification codes. |
| `/api/reservations/:id/reject` | `PATCH` | `donor` (owner), `admin` | Releases reserved inventory back to marketplace exactly once. |
| `/api/reservations/:id/cancel` | `PATCH` | `recipient` (owner), `donor`, `admin` | Releases inventory back to marketplace exactly once. Idempotent against repeat cancels. |
| `/api/tasks/board` | `GET` | `volunteer`, `admin` | Lists available unassigned courier pickup missions. |
| `/api/tasks/:id/claim` | `POST` | `volunteer` | Atomic concurrency protection: single-document CAS prevents race conditions when multiple couriers click simultaneously. |
| `/api/tasks/:id/status` | `PATCH` | Assigned `volunteer`, `donor`, `recipient`, `admin` | State machine validation (`unassigned` $\rightarrow$ `assigned` $\rightarrow$ `en_route_pickup` $\rightarrow$ `picked_up` $\rightarrow$ `en_route_delivery` $\rightarrow$ `delivered`). Constant-time SHA-256 hash comparison. Prevents code reuse. |
| `/api/tasks/:id/temp-log` | `POST` | Assigned `volunteer`, `admin` | Cold-chain temperature logging at pickup, transit, and delivery checkpoints. |
| `/api/admin/reports` | `GET` / `PATCH` | `admin` | Moderates safety and conduct reports. Ordinary users receive 403. |
| `/api/admin/users/:id/status` | `PATCH` | `admin` | Account suspension. Suspended users are immediately blocked from logging in or using existing tokens. |
| `/api/admin/audit-logs` | `GET` | `admin` | Paginated query of immutable audit log trail. |
| `/api/organizations/admin/*` | `GET` / `PATCH` | `admin` | Reviews and approves NGO verification credentials. Keeps sensitive registration documents private. |
| `/api/analytics` | `GET` | Public | Aggregates completed verified deliveries. Strictly separates physical scale readings (`actualRescuedKg`) from USDA estimates with zero double-counting. |

---

## 6. Interactive India Map Features

The map interface ([`FoodMap.jsx`](file:///C:/Users/Chinku/OneDrive/Desktop/MERN_Project/RescueBite/client/src/components/map/FoodMap.jsx)) integrates Leaflet and OpenStreetMap:
- **Default Nationwide View**: Centered on India (`[20.5937, 78.9629]`, zoom level 5).
- **Quick-Jump Region Selector**: Instant smooth panning to Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.
- **GeoJSON Native**: Directly accepts `[longitude, latitude]` arrays stored with MongoDB `2dsphere` indexes.
- **Donor Privacy Guard**: Displays city and neighborhood without exposing private home street addresses to unauthenticated visitors.
- **Zero Paid API Keys**: Uses community OpenStreetMap tiles with compliant attribution.

---

## 7. Automated Test Suite

RescueBite includes **69 automated unit and integration tests across 6 test suites** verifying authentication, organizations, spatial discovery, concurrency overbooking prevention, state machines, and code security:

```bash
cd server
npm test
```

### Test Suite Summary (69 Passing Tests):
- `tests/auth.test.js` (13 tests): Registration, login, password hashing, HttpOnly cookies, RBAC, profile updates.
- `tests/organization.test.js` (10 tests): NGO verification applications, admin review queue, document privacy.
- `tests/listing.test.js` (7 tests): Spatial queries, weighted recipient matching engine, ownership enforcement.
- `tests/reservation.test.js` (9 tests): Concurrent race conditions (zero overbooking), idempotency keys, exactly-once inventory release.
- `tests/workflows.test.js` (16 tests): Volunteer mission concurrency, state transitions, SHA-256 code hashes, code reuse protection, cold-chain temp logs, admin account suspension, analytics accuracy, idempotent background expiry sweeps, real-time socket authentication.
- `tests/securityAndDeployment.test.js` (14 tests): Live database health status & disconnect handling, CORS allowlist & untrusted origin rejection, static route priority (`/donor/mine` vs `/:id`), cross-role 403 access control, IDOR ownership protection, and high-concurrency reservation stress test.

---

## 8. Production Deployment Instructions

For complete step-by-step instructions, see [`DEPLOYMENT.md`](file:///C:/Users/Chinku/OneDrive/Desktop/MERN_Project/RescueBite/DEPLOYMENT.md).

### Quick Summary:

#### A. Backend on Render:
1. Create a **Web Service** pointing to your repository.
2. Root Directory: `server`
3. Build Command: `npm install` | Start Command: `npm start`
4. Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<your-atlas-uri>`
   - `JWT_SECRET=<secure-random-32-chars>`
   - `CLIENT_URL=https://<your-vercel-domain>.vercel.app`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=none`
5. Health Check Path: `/api/health`

#### B. Frontend on Vercel:
1. Import the repository into Vercel.
2. Root Directory: `client` | Framework: `Vite`
3. Environment Variables:
   - `VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api`
4. The included `client/vercel.json` automatically configures SPA rewrites and security headers.

---

## 9. Building & Verifying Locally

### Frontend Production Build:
```bash
cd client
npm run build
```
Builds optimized production assets to `client/dist`.

### Backend Production Server:
```bash
cd server
NODE_ENV=production npm start
```
Starts Express on `0.0.0.0:5000` with production security headers, rate limiting, and HttpOnly cookies.
