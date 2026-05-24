# Egypt Organized Trips — B2B Booking Platform
## Full Product Specification

---

## 1. Overview

A private web platform for a travel agency specializing exclusively in organized trips to Egypt. The agency operates **B2B only** — their clients are other travel agencies, not end travelers. The platform allows partner agencies to browse available trips and complete bookings for their groups.

The agency does **not** operate retail (B2C). There is no public-facing catalog.

---

## 2. Users

### 2.1 Partner Agencies (B2B clients)
- Each partner agency has its own account
- An agency account can have one or more staff users (logins)
- They browse trips, create bookings, upload passenger documents, and track booking status
- They cannot see other agencies' bookings

### 2.2 Platform Admins (the Egypt agency's own staff)
- Manage the trip catalog (create/edit trips, segments, departure dates)
- Set and update pricing
- Manage hotel inventory per destination
- Manage partner agency accounts
- View and manage all bookings across all agencies

---

## 3. Trip Data Model

### 3.1 Trip
A trip is a fixed organized package. It has:
- **Name** (e.g. "Cairo + Sharm el-Sheikh")
- **Destinations covered** (e.g. Cairo, Sharm el-Sheikh, Hurghada)
- **Segments**: ordered list of destination stops, each with a fixed number of nights
  - Example: [Cairo — 2 nights] → [Sharm el-Sheikh — 7 nights]
  - The order is configurable (Cairo-first or Sharm-first = same trip, different itinerary direction)
- **Total duration** = sum of all segment nights (derived, not manually set)
- **Status**: active / inactive

### 3.2 Departure Dates
Each trip has multiple departure dates. Each departure date ("run") has:
- Start date
- Itinerary direction (e.g. Cairo→Sharm or Sharm→Cairo)
- Availability status (open / closed / sold out)

### 3.3 Current Destination Examples
- Sharm el-Sheikh only
- Cairo only
- Cairo + Sharm el-Sheikh (either direction)
- Hurghada + combinations

---

## 4. Hotels

Each destination has a list of hotels, each assigned a tier:
- **3-star**
- **4-star**
- **5-star**

When booking, the partner agency selects one hotel tier for each destination segment. The hotel options shown are filtered by that tier and destination.

Admin can add/edit/remove hotels and assign them to destinations and tiers.

---

## 5. Pricing Model

Pricing is **per person**, set by admin staff. There is no per-night calculation — the trip is a fixed package.

Price varies by:
1. **Hotel tier** (3-star / 4-star / 5-star)
2. **Room type the passenger is assigned to**:
   - Single room (solo traveler)
   - Double room (price per person)
   - Triple room (price per person)
3. **Passenger type**:
   - Adult (in single / double / triple — each has its own rate)
   - Child (one flat rate per hotel tier, regardless of room type)

### Full Pricing Grid (per trip, per hotel tier):

| Room Type | Price per person |
|-----------|-----------------|
| Single (adult solo) | set by admin |
| Double (per adult) | set by admin |
| Triple (per adult) | set by admin |
| Child (any room) | set by admin |

Admin sets all four rates × three hotel tiers = 12 price points per trip.

Prices can be updated at any time by admin. Changes apply to new bookings only.

---

## 6. Booking Flow (Partner Agency Side)

A 5-step wizard:

### Step 1 — Select Trip & Departure Date
- Browse/filter trips by destination, duration, month
- Select a specific departure date (run)
- See remaining availability

### Step 2 — Add Passengers
- Enter number of adults and number of children
- System shows a running count and preliminary room suggestion

### Step 3 — Passport Details
- For each passenger (adult and child), enter:
  - Full name (as on passport)
  - Passport number
  - Nationality
  - Date of birth
  - Passport expiry date
- Option: bulk upload via Excel/CSV template for large groups

### Step 4 — Room Assignment & Hotel Selection
- Select hotel tier (3-star / 4-star / 5-star)
- System suggests room split based on group size
- Assign passengers to rooms (single / double / triple)
- Each passenger's room type determines their price
- Children assigned to rooms; billed at flat child rate

### Step 5 — Review & Confirm
- Full itemized price breakdown:
  - Per room type: number of passengers × rate
  - Child total
  - Grand total
- Agency confirms and submits booking

### Post-Booking
- Booking reference generated
- PDF voucher available for download
- Booking appears in agency's dashboard with status tracking

---

## 7. Booking Status Flow

```
Submitted → Documents Verified → Confirmed → Completed
                    ↓
               Pending Info (if documents incomplete)
```

Admin can update status. Agency can see current status from their dashboard.

---

## 8. Partner Agency Dashboard

What an agency sees when logged in:
- List of all their bookings (with status, trip name, departure date, pax count, total price)
- Filter by status / date range
- Click into any booking to see full details
- Download voucher / passenger manifest per booking
- Account details and user management

---

## 9. Admin Back-Office

### Trip Management
- Create / edit / deactivate trips
- Manage segments (destination, nights, order/direction)
- Add departure dates to trips
- Open / close / mark sold out specific runs

### Hotel Management
- Add / edit / remove hotels per destination
- Assign tier (3 / 4 / 5 star)

### Pricing Management
- Set the 12 price points per trip per hotel tier (single adult / double adult / triple adult / child × 3 tiers)
- Update prices at any time

### Agency Account Management
- Create / edit / deactivate partner agency accounts
- Manage users per agency

### Booking Management
- View all bookings across all agencies
- Update booking status
- Download passenger manifests
- Filter/search bookings

---

## 10. Key Design Constraints

- **B2B only**: no public pages, everything behind login
- **No dynamic pricing**: prices are fixed packages set by staff, not calculated per night
- **No payment processing**: the platform is for booking management only; payment is handled offline between the agency and their partners
- **Passport data is sensitive**: must be handled securely, stored encrypted
- **Bulk passenger upload**: agencies booking large groups need a CSV/Excel import option for passports
- **Multi-user agency accounts**: one agency = potentially multiple staff logins
- **Arabic + French/English**: consider multilingual UI (Algeria-based partner agencies likely need French or Arabic)

---

## 11. Tech Stack Suggestions

- **Frontend**: React (Next.js)
- **Backend**: Node.js or Django REST
- **Database**: PostgreSQL
- **Auth**: JWT with role-based access (admin / agency-user)
- **File storage**: S3-compatible for passport scans and PDF vouchers
- **PDF generation**: for vouchers and passenger manifests

---

## 12. Design Direction for UI

- Professional, trustworthy, clean
- Egypt-inspired visual identity (warm sand/gold tones, not kitsch)
- Booking wizard must feel simple and guided — agencies may book dozens of passengers
- Admin panel: dense, functional, data-first
- Mobile-friendly for the partner agency side (agents may book on the go)
