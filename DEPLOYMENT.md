# RescueBite — Production Deployment Guide
## Render (Backend) + Vercel (Frontend) + MongoDB Atlas (Database)

This guide provides step-by-step instructions for deploying RescueBite to production without Docker or container dependencies.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             End Users / QA             │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │       Vercel (SPA)        │                   │       Render (API)        │
   │  https://<app>.vercel.app │                   │ https://<api>.onrender.com│
   │  - React 19 + Vite        │  API Requests     │ - Express 5 REST API      │
   │  - Client Routing & Auth  ├──────────────────►│ - Socket.IO Real-time     │
   │  - Leaflet Map            │  (Bearer + Cookie)│ - Background Expiry Job   │
   │  - vercel.json rewrites   │                   │ - 0.0.0.0:10000 Binding   │
   └───────────────────────────┘                   └─────────────┬─────────────┘
                                                                 │ Mongoose TLS
                                                                 ▼
                                                   ┌───────────────────────────┐
                                                   │    MongoDB Atlas (M0+)    │
                                                   │ - 2dsphere Geo Indexes    │
                                                   │ - Atomic Reservations     │
                                                   │ - zero data wipe seeder   │
                                                   └───────────────────────────┘
```

---

## 1. MongoDB Atlas Setup

1. **Create an Atlas Account & Cluster**:
   - Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
   - Create a free **M0 Sandbox** or dedicated cluster in your target region (e.g., `ap-south-1` Mumbai).

2. **Configure Database User**:
   - Go to **Security** $\rightarrow$ **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - User Privileges: `readWriteAnyDatabase` or `Built-in Role: readWrite` on `rescuebite`.
   - Save the username and strong password.

3. **Configure Network Access**:
   - Go to **Security** $\rightarrow$ **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) since Render uses dynamic outbound IPs.
   - Click **Confirm**.

4. **Obtain Connection String**:
   - Go to **Deployment** $\rightarrow$ **Database**.
   - Click **Connect** $\rightarrow$ **Drivers** (Node.js).
   - Copy the SRV URI:
     ```text
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
     ```

---

## 2. Render Deployment (Backend Express API)

You can deploy using Render's Web UI or via the included `render.yaml` blueprint.

### Option A: Render Web Dashboard (Manual)

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `https://github.com/smrutisanamsahoo26-glitch/RescueBite`.
4. Configure service parameters:
   - **Name**: `rescuebite-api`
   - **Region**: Singapore or Frankfurt (choose nearest to users)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Advanced** $\rightarrow$ **Health Check Path**:
   - Set to: `/api/health`
6. Add the following **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & optimizations |
| `PORT` | `10000` | Render assigns dynamic port; server listens on `0.0.0.0` |
| `MONGODB_URI` | `mongodb+srv://...` | Your real MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `rescuebite` | Primary database name |
| `JWT_SECRET` | *(Random 32+ char string)* | Private key for signing tokens |
| `JWT_EXPIRES_IN` | `1d` | Session validity duration |
| `COOKIE_SECURE` | `true` | Required for HTTPS production cookies |
| `COOKIE_SAME_SITE` | `none` | Required for cross-site cookies between Vercel and Render |
| `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | Allowed CORS origin (comma-separated for previews) |
| `CLOUDINARY_CLOUD_NAME` | *(Optional)* | Cloudinary cloud name for food photo uploads |
| `CLOUDINARY_API_KEY` | *(Optional)* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | *(Optional)* | Cloudinary API secret |

7. Click **Create Web Service**.
8. Once deployed, test the live health endpoint:
   ```bash
   curl https://rescuebite-api.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "RescueBite API Server is operational",
     "data": {
       "status": "UP",
       "uptimeSeconds": 45,
       "environment": "production",
       "database": { "status": "connected" }
     }
   }
   ```

---

## 3. Vercel Deployment (Frontend React App)

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import the GitHub repository: `smrutisanamsahoo26-glitch/RescueBite`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)
5. Add **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://rescuebite-api.onrender.com/api` | Render backend API endpoint |
| `VITE_SHOW_DEMO_BAR` | `false` | Set `true` if you want the persistent demo role switcher |

6. Click **Deploy**.
7. Vercel will build the SPA bundle and deploy to `https://<project-name>.vercel.app`.
8. Copy your live Vercel URL and update the `CLIENT_URL` environment variable on Render so CORS accepts requests from your live domain.

---

## 4. Seeding Demo Accounts in Atlas (Optional)

RescueBite includes an Indian region demo dataset with 4 pre-configured persona accounts.
The seeder is **non-destructive** (uses upsert) and will **never** delete real user data.

To seed records into your remote Atlas database:

```bash
# In your local terminal, point MONGODB_URI to your Atlas cluster:
cd server
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net" npm run seed:demo
```

### Pre-Configured Demo Accounts:
Password for all demo accounts: `DemoPassword123!`

- **Donor**: `rajesh.mumbai@demo-rescuebite.org` (Chef Rajesh Khanna - Bandra Artisanal Bakery)
- **Recipient Org**: `sunita.seva@demo-rescuebite.org` (Sunita Patil - Seva Food Relief Foundation)
- **Volunteer Courier**: `rohan.volunteer@demo-rescuebite.org` (Rohan Sharma - Active Mumbai Courier)
- **Platform Admin**: `superadmin@rescuebite.org` (Platform SuperAdmin)

---

## 5. Pre-Deployment QA Checklist

- [x] All 69 Vitest integration tests passing.
- [x] Client production build (`vite build`) generates clean bundle.
- [x] Client `.gitignore` and Server `.gitignore` protect `.env` from version control.
- [x] Server binds to `0.0.0.0` on `process.env.PORT`.
- [x] Express route order verified: `/donor/mine` placed before `/:id`.
- [x] Dynamic CORS allowlist with credentialed requests supported.
- [x] HttpOnly session cookies configured with `secure: true` and `sameSite: none`.
- [x] Dual-authentication fallback: Bearer token in `Authorization` header for browsers restricting third-party cookies.
- [x] Database indexes created: `location: 2dsphere` on `FoodListing` and `Organization`.
- [x] Concurrency protection verified: atomic conditional inventory decrement prevents overbooking.
- [x] State machine guards and SHA-256 verification codes prevent unauthorized pickup/delivery completions.
- [x] Admin telemetry endpoints strictly gated to `admin` role with 403 enforcement.
