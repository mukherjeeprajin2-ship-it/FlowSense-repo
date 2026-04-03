# 🗄️ TrafficIQ — Database Design

This folder contains everything needed to set up, deploy, and seed the Firestore database for the TrafficIQ Smart Traffic Management System.

> **Private database.** All collections are locked down — only authenticated admins and the backend (Admin SDK) can access data. Regular users and unauthenticated requests are fully blocked.

---

## Collections Overview

### `complaints`
Stores road issue reports managed internally by the admin team.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID v4 — document ID |
| `type` | `string` | `Pothole` \| `Signal Malfunction` \| `Flooding` \| `Road Blockage` \| `Accident` \| `Construction` \| `Other` |
| `description` | `string` | Free-text description of the issue |
| `road_name` | `string?` | Road name (optional) |
| `location` | `map` | `{ lat: number, lng: number, address: string }` |
| `status` | `string` | `Open` \| `In Progress` \| `Resolved` \| `Closed` |
| `timestamp` | `string` | ISO 8601 — when the complaint was created |
| `updated_at` | `string` | ISO 8601 — when the status was last changed |

**Example document:**
```json
{
  "id": "a3f2c1d4-...",
  "type": "Pothole",
  "description": "Large pothole near Gemini flyover, ~30 cm wide.",
  "road_name": "Anna Salai",
  "location": {
    "lat": 13.0604,
    "lng": 80.2496,
    "address": "Gemini Flyover, Anna Salai"
  },
  "status": "Open",
  "timestamp": "2025-04-02T09:14:00.000Z",
  "updated_at": "2025-04-02T09:14:00.000Z"
}
```

---

### `traffic_data`
Stores processed traffic density data per road. Document ID is the road name in snake_case (e.g. `anna_salai`).

| Field | Type | Description |
|---|---|---|
| `road_name` | `string` | Human-readable road name |
| `congestion_level` | `number` | Score from `0` (free flow) to `100` (gridlock) |
| `congestion_label` | `string` | `Low` \| `Medium` \| `High` |
| `estimated_count` | `number` | Estimated number of vehicles on the road segment |
| `travel_time` | `number?` | Travel time in minutes (from Google Maps Distance Matrix API) |
| `signal_timing` | `map` | `{ greenTime, redTime, yellowTime, cycleTime }` in seconds |
| `color` | `string` | Hex color for map marker (`#22c55e` / `#f59e0b` / `#ef4444`) |
| `processed_at` | `string` | ISO 8601 — when this record was last updated |

**Example document:**
```json
{
  "road_name": "Anna Salai",
  "congestion_level": 85,
  "congestion_label": "High",
  "estimated_count": 340,
  "travel_time": 28,
  "signal_timing": {
    "greenTime": 70,
    "redTime": 20,
    "yellowTime": 5,
    "cycleTime": 95
  },
  "color": "#ef4444",
  "processed_at": "2025-04-02T09:00:00.000Z"
}
```

---

## Signal Timing Logic

| Label | Congestion Score | Est. Vehicles | Green | Red | Yellow |
|---|---|---|---|---|---|
| Low | 0 – 33 | 10 – 80 | 30s | 60s | 5s |
| Medium | 34 – 66 | 80 – 200 | 45s | 45s | 5s |
| High | 67 – 100 | 200 – 400 | 70s | 20s | 5s |

---

## Indexes

| Collection | Fields |
|---|---|
| `complaints` | `type ASC` + `timestamp DESC` |
| `complaints` | `status ASC` + `timestamp DESC` |
| `complaints` | `road_name ASC` + `timestamp DESC` |
| `traffic_data` | `congestion_level DESC` |

---

## Security Rules

The database is **fully private — no public access.**

| Who | Access |
|---|---|
| Unauthenticated users | Blocked entirely |
| Authenticated regular users | Blocked entirely |
| Authenticated admins (`admin: true` custom claim) | Full read + write |
| Backend (Firebase Admin SDK) | Full access — bypasses all rules |

Access is granted only when **all three** conditions are true:
1. The request is authenticated (`request.auth != null`)
2. The account's email is verified (`email_verified == true`)
3. The account has a custom `admin: true` claim set by you via the Admin SDK

### Setting the admin custom claim

Run this once to promote a Firebase Auth user to admin:
```js
const admin = require('firebase-admin');
await admin.auth().setCustomUserClaims('PASTE_USER_UID_HERE', { admin: true });
```
Get the `uid` from **Firebase Console → Authentication → Users**.

---

## Setup & Deployment

```bash
# 1. Install
npm install

# 2. Add credentials
cp .env.example .env   # fill in Firebase service account values

# 3. Seed sample data
npm run seed

# 4. Deploy rules + indexes
npm install -g firebase-tools
firebase login
firebase use your-project-id
npm run deploy:all
```

---

## File Structure

```
database-design/
├── firestore.rules          # Security rules — admin-only access
├── firestore.indexes.json   # Composite index definitions
├── firebase.json            # Links rules + indexes for firebase deploy
├── seed.js                  # Populates both collections with sample data
├── package.json             # Dependencies + npm scripts
├── .env.example             # Firebase credentials template
└── README.md                # This file
```
