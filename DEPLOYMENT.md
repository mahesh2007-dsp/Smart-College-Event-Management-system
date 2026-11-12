# 🚀 Smart College Event Management System (Smart CEMS) - Deployment Guide
### Rajiv Gandhi University of Knowledge Technologies (RGUKT) - IIIT RK Valley

This guide covers deployment options for Smart CEMS across cloud platforms, Docker containers, and university intranet servers.

---

## 📋 Technology & Port Architecture

| Service | Port | Description |
|---|---|---|
| **React 18 SPA (Vite)** | `3000` (Dev) / `5000` (Prod) | Single-page application bundle (`frontend/dist`) |
| **Node.js Express Server** | `5000` (or `$PORT`) | REST API + Static Frontend host |
| **Python 3 AI Microservice** | `5001` (or `$PYTHON_AI_URL`) | Recommendation engine & SHA-256 certificate integrity |
| **Database** | SQL / Supabase | Local JSON database with plug-and-play Supabase Cloud PostgreSQL support |

---

## 🌟 Option 1: Render.com Cloud Deployment (Free & Automated) - Recommended

Render can run the entire multi-tier system in a single container using our provided `Dockerfile` and `render.yaml`.

### Step-by-Step Instructions:
1. **Push your repository to GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Smart CEMS"
   git remote add origin https://github.com/your-username/smart-college-event-management-system.git
   git push -u origin main
   ```
2. **Log in to [Render.com](https://render.com).**
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. In settings:
   - **Environment:** `Docker` (or select `Blueprint` to use `render.yaml`)
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** Free
6. Under **Environment Variables**, set:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `PYTHON_AI_URL` = `http://localhost:5001`
7. Click **Create Web Service**.
   Render will automatically build the React assets with Vite, install Node and Python dependencies, start the services, and provide you with a live `https://<your-service>.onrender.com` URL!

---

## 🐳 Option 2: Docker / VPS / DigitalOcean / AWS EC2

If you have a Linux VPS or cloud instance:

### One-Command Deployment with Docker Compose:
```bash
docker compose up -d --build
```
Your app will be live at: `http://<your-server-ip>:5000`.

### Standalone Docker Run:
```bash
docker build -t rgukt-smart-cems .
docker run -d -p 5000:5000 --name smart-cems rgukt-smart-cems
```

---

## 🚂 Option 3: Railway.app Deployment

1. Go to [railway.app](https://railway.app) and click **Start a New Project**.
2. Select **Deploy from GitHub repo**.
3. Railway automatically detects the `Dockerfile` and deploys both the Node.js server and Python microservice on an assigned domain.
4. Under Variables, ensure:
   - `PORT` = `5000`
   - `PYTHON_AI_URL` = `http://localhost:5001`

---

## ⚡ Option 4: Campus Intranet / Local University Server

To host the system on the local RGUKT RK Valley campus LAN:

### 1. Build Production Frontend:
```bash
npm run build
```

### 2. Start Production Mode:
```bash
npm run start:prod
# or: bash start-prod.sh
```

### 3. Access Across Campus:
The server binds to `0.0.0.0:5000`, making it accessible across the campus Wi-Fi / LAN:
```
http://<server-lan-ip>:5000
```
(e.g., `http://10.2.x.x:5000` or `http://172.16.x.x:5000`).

---

## 🗄️ Optional: Connecting to Supabase Cloud PostgreSQL

By default, Smart CEMS operates on a zero-config, highly-optimized local JSON database engine stored in `backend/data/`.

If you wish to switch to Supabase Cloud PostgreSQL:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and execute the contents of `database/supabase_setup.sql`.
3. In your environment variables or `backend/.env`, set:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Restart the backend. Smart CEMS will automatically connect to your cloud database!

---

## ✅ Deployment Verification Checklist

- [x] React 18 production bundle compiled cleanly (`frontend/dist/`)
- [x] Backend static server properly serves SPA (`/*` wildcard fallback to `dist/index.html`)
- [x] Unhandled API routes explicitly return 404 JSON instead of falling through to HTML
- [x] Python AI microservice detects both short branch codes (`CSE`, `ECE`) and full university department titles
- [x] Dynamic SHA-256 cryptographic certificate verification active
- [x] Production runner script (`start-prod.sh`) and `Dockerfile` configured
