# Issue: End-to-End Verification & Modernization of Shipper Portal Functionality

## Description
Perform a comprehensive functional audit, testing, and UI/UX modernization of the **Shipper Portal** (`/shipper/*`) across all 6 core modules to ensure 100% adherence to SRS specifications, seamless integration with real PostgreSQL/Supabase database tables, real-time FastAPI AI Engine pricing, and elimination of any placeholder mocks or legacy browser alerts.

---

## Scope & Module Breakdown

### 1. Operations & Freight Dispatch (`/shipper/operations`)
- [ ] **Freight Order Placement (`FreightOrderForm.tsx`)**:
  - Test order submission with custom origins/destinations along Addis-Djibouti corridor.
  - Verify live spot quote generation calling FastAPI AI Engine (`POST /pricing/quote`).
  - Verify compliance check: block or warn unverified shippers per SRS Section 3.1 FR-01.
- [ ] **Active Shipment Tracking (`ActiveShipment.tsx`)**:
  - Verify live `IN_TRANSIT` shipment data fetching from DB.
  - Test e-CMR Waybill download (FR-04) with real shipment tracking number and cargo details.
  - Fix hardcoded transporter name (`Kangaroo Freight`) in `RatingModal` to use real driver/transporter from DB.
  - Ensure Leaflet map renders smoothly without tile glitches.

---

### 2. Live Bids & Reverse Auction (`/shipper/bids`)
- [ ] **Load & Bids Exchange (`BidsTab.tsx`)**:
  - Verify active loads listing (`GET /api/v1/shipper/loads`).
  - Verify automated AI matching trigger if no bids exist (`POST /api/v1/shipper/loads/:id/match`).
  - Validate AI match score calculation, driver proximity, and carrier star ratings.
- [ ] **Escrow Lock & Awarding (`acceptBidEscrow`)**:
  - Test bid acceptance transaction: marks bid as `ACCEPTED`, rejects other bids, transitions load to `MATCHED`, creates `shipments` record, and locks TeleBirr escrow payment in `payments` table.
  - Replace native browser `alert()` with modern toast notifications and smooth redirects.

---

### 3. Contract Rates Management (`/shipper/contract_rates`)
- [ ] **Tiered Tariff Agreements (`ContractRates.tsx`)**:
  - Verify contract rate listing with live comparison against real-time AI spot prices.
  - Replace native browser `alert('Renegotiation initiated')` with sleek toast feedback.
  - Test modal for creating new long-term contracts (`POST /api/v1/shipper/contract-rates`).

---

### 4. Corridor Telematics & Live GPS (`/shipper/telematics`)
- [ ] **GPS Tracking & Corridor Geofences (`TelematicsTab.tsx`)**:
  - Verify WebSocket connection status indicator (`Live Socket Connected`).
  - Test live coordinate plotting along Djibouti–Galafi–Semera–Awash–Modjo corridor.
  - Verify dynamic Risk Zone polygons and speed alert monitoring.

---

### 5. Customs e-Vault & Declarations (`/shipper/customs`)
- [ ] **Regulatory Manifests & Documents (`CustomsTab.tsx`)**:
  - Verify client-side SHA-256 cryptographic hashing for Invoices, Packing Lists, Bill of Lading, and Certificate of Origin.
  - Verify active load linkage and customs verification status badges.
  - Replace legacy alerts with inline toast notifications.

---

### 6. Shipper Organization Settings (`/shipper/settings`)
- [ ] **Business Profile & Compliance (`SettingsTab.tsx`)**:
  - Test fetching and updating organization details (TIN, Trade License, Phone, Notifications).
  - Ensure synchronization with `users` and `users.metadata` table.

---

## Acceptance Criteria
1. All 6 tabs fetch and mutate real data from backend endpoints (`/api/v1/shipper/*`).
2. No legacy browser popup alerts (`window.alert`) remain; all notifications use sleek Supabase-dark toasts.
3. Hardcoded strings (such as "Kangaroo Freight") are replaced with real database entity references.
4. UI conforms to 10/10 Supabase dark aesthetic tokens (`#171717`, `#121212`, `#242424`, `#3ECF8E`).
5. Zero TypeScript errors in `npm --prefix web run build` and `npm --prefix backend run build`.
