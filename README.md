#  Disposable Camera

A full-stack event photo experience. Guests scan a QR code, take photos on their phones, and all memories stay hidden until the couple reveals them the next day.

---

## Features

-  **Guest camera page** — elegant viewfinder UI, upload or take photos, film strip, shot counter
-  **Hidden gallery** — photos are locked until the couple reveals them
-  **Reveal flow** — admin presses "Reveal Gallery" and all guests can see the photos
-  **Masonry gallery** — responsive photo grid with lightbox, guests' own photos highlighted
-  **Admin panel** — password-protected dashboard with QR code, photo grid, delete, reveal button
-  **Image compression** — client-side compression before upload
-  **Rate limiting** — max 100 uploads per IP per hour
-  **Google Cloud Storage** — private bucket with signed URLs (24hr expiry)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| Storage | Google Cloud Storage |
| Database | PostgreSQL (Supabase recommended) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd wedding-camera
npm install
```

### 2. Set up Google Cloud Storage

1. Create a GCP project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Cloud Storage API**
3. Create a **Service Account** with the `Storage Object Admin` role
4. Download the **JSON key file** for the service account
5. Create a **private GCS bucket** (do NOT enable public access)
6. Note the bucket name

### 3. Set up Database (Supabase recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `setup.sql`
3. Copy the **connection string** from Project Settings → Database

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```env
# Paste the entire service account JSON as a single line
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

GCS_BUCKET_NAME=your-bucket-name
ADMIN_PASSWORD=choose-a-strong-password
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 5. Run Locally

```bash
npm run dev
```

Visit:
- **Guest camera**: http://localhost:3000/camera
- **Gallery**: http://localhost:3000/gallery  
- **Admin**: http://localhost:3000/admin

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_BASE_URL` to your Vercel URL
5. Deploy!

---

## Usage Guide

### On the Wedding Day

1. Open `/admin` and print the QR code (or display on a screen)
2. Guests scan the QR → land on `/camera` → take photos
3. Photos are uploaded anonymously to GCS

### The Next Day (or Whenever You're Ready)

1. Open `/admin` and enter your password
2. Review all photos (delete any you want)
3. Click **"Reveal Gallery"**
4. Share `/gallery` with your guests — they'll see all the photos!

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload a photo (multipart/form-data) |
| `/api/gallery` | GET | Get all photos (public, only if revealed) |
| `/api/gallery?admin=true` | GET | Get all photos (admin, always) |
| `/api/reveal` | POST | Reveal the gallery (admin) |
| `/api/status` | GET | Check if gallery is revealed |
| `/api/init` | POST | Initialize database tables (admin) |

Admin endpoints require `x-admin-password` header.

---

## Project Structure

```
wedding-camera/
├── app/
│   ├── camera/page.tsx      # Guest camera page
│   ├── gallery/page.tsx     # Photo gallery page
│   ├── admin/page.tsx       # Admin dashboard
│   └── api/
│       ├── upload/route.ts  # Photo upload
│       ├── gallery/route.ts # Gallery data
│       ├── reveal/route.ts  # Reveal gallery
│       ├── status/route.ts  # Gallery status
│       └── init/route.ts    # DB init
├── lib/
│   ├── db.ts                # Database queries
│   ├── gcs.ts               # GCS utilities
│   └── rateLimit.ts         # Rate limiting
├── setup.sql                # Database schema
└── .env.example             # Environment template
```

---

## Security Notes

- GCS bucket is **private** — no public access
- All photo URLs are **signed** with 24-hour expiry
- Admin routes require `ADMIN_PASSWORD` header
- Guest sessions are **anonymous** (random UUID in localStorage)
- Rate limiting: 100 uploads per IP per hour
