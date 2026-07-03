# SmartCanteen 360 - Complete Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Backend Deployment](#backend-deployment)
5. [Web Admin Portal Deployment](#web-admin-portal-deployment)
6. [Mobile App Build](#mobile-app-build)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v20.11.0 or higher
- **pnpm** v9.0.0 or higher
- **Git**
- **Docker** (optional, for containerized deployment)
- **Expo CLI** (for mobile app)

### Accounts Needed
- **Supabase** account (for PostgreSQL database)
- **Vercel** or hosting provider (for web deployment)
- **Expo** account (for mobile app builds)
- **Docker Hub** (optional, for image registry)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd SmartCateen
```

### 2. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install all workspace dependencies
pnpm install
```

### 3. Create Environment Files

#### Root `.env` file:
```bash
# Copy the example environment file
cp .env.example .env
```

#### Edit `.env` with your values:
```env
# ============================================================================
# SmartCanteen 360 — Environment Configuration
# ============================================================================

# ---- Database (Supabase Postgres) ------------------------------------------
# Get these from your Supabase dashboard: https://app.supabase.io
# Go to Settings > Database > Connection String

# Pooled connection (PgBouncer, port 6543) — used by the app at runtime
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (port 5432) — used by Prisma Migrate / introspection only
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ---- Supabase (Storage / Auth helpers / Realtime) --------------------------
# Get these from Supabase dashboard: Settings > API
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"  # Server only — never expose to clients
SUPABASE_STORAGE_BUCKET="smartcanteen"

# ---- API -------------------------------------------------------------------
NODE_ENV="development"  # Options: development, production, test
API_PORT=4000
API_GLOBAL_PREFIX="api"
API_VERSION="v1"
CORS_ORIGINS="http://localhost:3000,http://localhost:8081"

# ---- Auth / JWT ------------------------------------------------------------
# Generate strong secrets: openssl rand -base64 32
JWT_ACCESS_SECRET="change-me-access-secret-min-32-chars"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_SECRET="change-me-refresh-secret-min-32-chars"
JWT_REFRESH_TTL="30d"
BCRYPT_SALT_ROUNDS=12
COOKIE_DOMAIN="localhost"

# ---- Redis (BullMQ queues, caching, rate limit) ---------------------------
# Use Upstash (https://upstash.com) or local Redis
REDIS_URL="redis://localhost:6379"

# ---- Email (SMTP) -----------------------------------------------------------
# Use Resend (https://resend.com), SendGrid, or Mailtrap for testing
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="SmartCanteen 360 <no-reply@smartcanteen.local>"

# ---- Push notifications (Expo) -----------------------------------------------
# Get from https://expo.dev/settings/access-tokens
EXPO_ACCESS_TOKEN=""

# ---- Payments (adapters — leave blank to disable a provider) --------------
# South African payment providers
PAYFAST_MERCHANT_ID=""
PAYFAST_MERCHANT_KEY=""
PAYFAST_PASSPHRASE=""

PEACH_ENTITY_ID=""
PEACH_ACCESS_TOKEN=""

OZOW_SITE_CODE=""
OZOW_PRIVATE_KEY=""
OZOW_API_KEY=""

YOCO_SECRET_KEY=""

# ---- Web admin (Next.js) ---------------------------------------------------
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"

# ---- Mobile (Expo) ---------------------------------------------------------
EXPO_PUBLIC_API_URL="http://localhost:4000/api/v1"

# ---- QR encryption ---------------------------------------------------------
# Generate: openssl rand -hex 32
QR_ENCRYPTION_KEY="change-me-32-byte-hex-key-00000000000000000000000000000000"
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [https://app.supabase.io](https://app.supabase.io)
2. Click "New Project"
3. Enter project name: `smartcanteen-360`
4. Choose a database password (save this!)
5. Select region closest to your users
6. Click "Create new project"

### 2. Get Database Connection Strings

1. In your Supabase dashboard, go to **Settings > Database**
2. Scroll down to **Connection String**
3. Copy the **URI** format string
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Update Environment Variables

Edit your `.env` file and update these values with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Seed the database with initial data
pnpm db:seed
```

### 5. Verify Database Connection

```bash
# Open Prisma Studio to view your database
pnpm db:studio
```

This will open Prisma Studio at `http://localhost:5555` where you can view and manage your database tables.

---

## Backend Deployment

### Option A: Local Development

```bash
# Start the API server in development mode
pnpm --filter @smartcanteen/api dev

# The API will be available at http://localhost:4000
# Swagger documentation at http://localhost:4000/docs
```

### Option B: Docker Deployment

```bash
# Build and start all services with Docker Compose
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Option C: Production Deployment (VPS/Cloud)

1. **Build the API:**
```bash
# Install production dependencies
pnpm install --frozen-lockfile

# Build the API
pnpm --filter @smartcanteen/api build
```

2. **Set up environment on server:**
```bash
# Create app directory
mkdir -p /var/www/smartcanteen

# Copy build files
cp -r apps/api/dist /var/www/smartcanteen/
cp -r apps/api/node_modules /var/www/smartcanteen/
cp apps/api/package.json /var/www/smartcanteen/
cp .env /var/www/smartcanteen/
```

3. **Set up PM2 process manager:**
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > /var/www/smartcanteen/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'smartcanteen-api',
    script: './dist/main.js',
    cwd: '/var/www/smartcanteen',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Set up Nginx reverse proxy:**
```bash
# Install Nginx
sudo apt update && sudo apt install nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/smartcanteen << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/smartcanteen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Web Admin Portal Deployment

### Option A: Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy to Vercel:**
```bash
# From the project root
cd apps/web

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

3. **Configure Environment Variables in Vercel:**
   - Go to your project in the Vercel dashboard
   - Navigate to **Settings > Environment Variables**
   - Add all variables from your `.env` file:
     - `NEXT_PUBLIC_API_URL`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option B: Build and Deploy Static Files

```bash
# Build the web app
cd apps/web
pnpm build

# The static files will be in the `dist` folder
# Copy these to your web server
scp -r dist/* user@your-server:/var/www/smartcanteen-web/
```

---

## Mobile App Build

### 1. Install Expo CLI

```bash
npm install -g expo-cli
```

### 2. Configure Environment

Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
```

### 3. Build for iOS

```bash
cd apps/mobile

# Build for iOS simulator
expo build:ios --type simulator

# Or build for App Store
expo build:ios --type archive
```

### 4. Build for Android

```bash
cd apps/mobile

# Build APK
expo build:android --type apk

# Or build AAB for Play Store
expo build:android --type app-bundle
```

### 5. Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Domain names configured
- [ ] Backup strategy in place

### Security
- [ ] JWT secrets are strong and unique
- [ ] Database passwords are secure
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are active

### Monitoring
- [ ] Error tracking configured (Sentry recommended)
- [ ] Application logs are being collected
- [ ] Database performance monitoring enabled
- [ ] Uptime monitoring configured

### Backups
- [ ] Automated database backups scheduled
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: Can't reach database server
```
**Solution:**
- Verify DATABASE_URL and DIRECT_URL in .env
- Check if Supabase project is active
- Ensure IP allowlist includes your server IP

#### 2. JWT Token Errors
```
Error: invalid signature
```
**Solution:**
- Regenerate JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
- Ensure same secrets are used across all services
- Restart all services after changing secrets

#### 3. CORS Errors
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution:**
- Add your frontend domain to CORS_ORIGINS in .env
- Ensure CORS_ORIGINS includes protocol (http:// or https://)
- Restart API server after changes

#### 4. Mobile App Not Connecting
```
Network request failed
```
**Solution:**
- Check EXPO_PUBLIC_API_URL in apps/mobile/.env
- Ensure API URL is accessible from mobile device
- For local testing, use ngrok or similar tunnel

### Getting Help

- Check the logs: `docker-compose logs -f [service]`
- Review Prisma schema: `pnpm db:validate`
- Test API health: `curl http://localhost:4000/health`

---

## Support & Resources

- **Documentation**: [Add your documentation link]
- **API Documentation**: Available at `/docs` when API is running
- **Issue Tracker**: [Add your issue tracker link]
- **Slack/Discord**: [Add your community link]

---

**Last Updated**: 2024
**Version**: 1.0.0
