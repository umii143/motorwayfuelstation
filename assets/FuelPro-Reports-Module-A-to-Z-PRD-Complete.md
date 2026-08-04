# FuelPro — Enterprise Intelligence Platform: The Complete A-to-Z PRD
### "Har Report Aik Kahani Sunata Hai — Aur Har Kahani Sach Hoti Hai"
### (Every Report Tells a Story — And Every Story Is True)
### v3.0 — Master Enterprise Workspace & Intelligence Platform Blueprint (10/10)

---

## PREFACE — Who This Document Is Really For

This is not a report module written for a data analyst. It is written for **Imran, a matric-pass salesman who has been on the pump for six months**, and for **Rasheed Sahab, a manager who has run three different stations in his career and has never used an app more complicated than WhatsApp.** If either of them cannot open a report, understand it in ten seconds, and know what to do next — the report has failed, no matter how technically correct its numbers are.

Every single report in this document follows one law: **Big number first. Simple label under it. Color tells you if it's good or bad. Tap to go deeper. Nothing else on the screen unless it earns its place.**

Every number in every report comes from **Firebase (Firestore + Realtime Database)**, live, as it happens — a sale recorded at 3:14 PM shows up in the report by 3:14 PM and one second, not at the end of the day, not after a manual sync button is pressed. There is no test data, no placeholder numbers, no "Lorem Ipsum" screens anywhere in this module, ever — not even during development, where a dedicated seeded-but-clearly-labeled sandbox project is used instead of ever letting fake numbers touch a real owner's screen.

---

## PART 1 — DESIGN PHILOSOPHY FOR THE REPORTS MODULE

### 1.1 The Three-Second Rule
Every report's top section (the part visible without scrolling) must answer, within three seconds of opening: **What is this number? Is it good or bad? What period does it cover?** If a user has to scroll or tap to find out whether ₨45,000 is a good or bad expense figure for the month, the report has failed the Three-Second Rule and must be redesigned.

### 1.2 KPI Cards, Not Tables, As the Front Door
Every report opens on a grid of **KPI Cards** — large number, short Urdu/English label, a small trend arrow (up/down vs. last period), and a color wash (green = good, red = needs attention, amber = neutral/watch). Tables, charts, and detailed line items exist **behind** these cards, reached by tapping — never shown first. A salesman should never open a report and see a spreadsheet-looking grid as the first thing.

### 1.3 Drill-Down, Always Three Levels Deep, Never More
Every report in this module follows the same drill-down depth so users build one mental model that works everywhere:
- **Level 1 — KPI Card** (the headline number)
- **Level 2 — Category/Breakdown View** (tap the card, see it split into its components — by category, by staff, by product, by date)
- **Level 3 — Line-Item Detail** (tap any row in Level 2, see the actual individual entries — the specific shift, the specific expense, the specific invoice — with a link back to the source record)

No report is allowed to bury information at a Level 4 or deeper — if a report needs a fourth level, it is a sign the report itself should be split into two reports.

### 1.4 Language and Literacy Design
- Every label appears in **both Urdu and English simultaneously** by default (not a toggle — side by side, small English under large Urdu, or vice versa per user preference set once in Settings), because mixed literacy within a single station's staff is the normal case, not the exception.
- **Numbers, never jargon.** A report never says "Variance Coefficient" — it says "Farq" (Difference) with a rupee amount. It never says "Aging Bucket 60-90" without also saying "60 din se zyada purana udhaar" next to it.
- **Icons carry meaning before text does.** A fuel drop icon for sales, a currency-note icon for cash, a person icon for staff, a truck icon for suppliers — consistent across every report so recognition becomes automatic within the first week of use.
- **Color is never the only signal** (colorblind-safe design) — every red/green/amber cue is paired with an icon (⚠, ✓, ↑↓) or a word, never color alone.

### 1.5 One Home Screen for All Reports — The A-to-Z Menu
The Reports Module opens to a single scrollable menu, organized alphabetically exactly as laid out in Part 2 below, with a **search bar at the top** ("Kaunsi report chahiye?" — type "expense" or "کرچ" and it filters instantly) and a **"My Frequent Reports"** row at the very top showing the 4 reports this specific user opens most often (personalized per login, computed from actual usage — not a fixed list), so a returning user rarely even needs to scroll the alphabet.

---

## PART 2 — THE COMPLETE A-TO-Z REPORT MENU

Every entry below follows the same fixed template: **Purpose (Why This Report Exists) → What You See First (KPI Cards) → Drill-Down Path → Filters Available → Who Uses This → Real-Time Data Source (Firebase).**

---

### A — Aaj Ka Khulasa (Today's Summary Dashboard)

**Purpose:** The very first screen anyone sees when they open Reports. Answers "how is today going, right now?" without a single tap.

**What You See First (KPI Cards, 6 total, 2x3 grid):**
1. Total Liters Sold Today (live-updating as shifts submit)
2. Total Sales Value Today (₨)
3. Cash Position Right Now (cash + bank + digital, combined)
4. Active Shifts (how many shifts are currently open across the station/branches)
5. Today's Expenses (₨)
6. Flagged Shifts Needing Review (count, red badge if >0)

**Drill-Down Path:** Tap any card → jumps directly into that specific report elsewhere in the A-Z menu (this is the one report that is entirely made of shortcuts into other reports — it has no Level 2/3 of its own).

**Filters Available:** Branch selector only (if multi-branch owner) — this report is always "today," by design; historical view happens in "D — Daily Report Summary" below.

**Who Uses This:** Owner (opens this first, every single time), Manager (checks mid-day).

**Real-Time Data Source (Firebase):** Firestore collection `stations/{stationId}/liveDashboard` — a single denormalized document updated via a Cloud Function trigger every time a shift document in `stations/{stationId}/shifts` changes status, so the dashboard never has to re-aggregate the whole day's shifts on every screen open (fast even on a slow connection).

---

### B — Bank Cash Ledger

**Purpose:** Shows exactly what has gone into and out of every bank account linked to the station, sourced entirely from shift collections and manual entries — never a number the owner has to reconcile against a separate bank app by memory.

**What You See First (KPI Cards):**
1. Total Bank Balance (across all accounts, combined)
2. This Month's Bank Deposits
3. This Month's Bank Withdrawals/Payments
4. Last Reconciliation Date (when was this last checked against the actual bank statement)

**Drill-Down Path:**
- Level 2: One card per bank account (e.g., "HBL Current Account", "Meezan Account") showing that account's running balance
- Level 3: Full transaction list for that account — date, description, debit/credit, running balance, and a tag showing whether it came "From Shift #1234" or was a "Manual Entry"

**Filters Available:** Date range, specific bank account, transaction type (deposit/withdrawal).

**Who Uses This:** Owner, Accountant.

**Real-Time Data Source:** Firestore `stations/{stationId}/ledgerEntries` where `ledgerType == "bank"`, indexed by `bankAccountId` and `entryDate`, with a live `onSnapshot` listener so a new shift's bank collection appears in this ledger within moments of shift submission.

---

### C — Cash Book, Cash Variance & Credit Given Today

**C1 — Cash Book (Rokar Bahi)**

**Purpose:** The single most-checked report by any station owner in Pakistan — literally "what physical cash exists in this business right now, and where did every rupee of it come from."

**What You See First:** Opening Cash (start of day), Total Cash In, Total Cash Out, Closing Cash (right now, live).

**Drill-Down:** Level 2 — cash in by source (fuel sales, recoveries) vs. cash out by destination (expenses, supplier payments, bank deposits). Level 3 — individual entries, each tagged with its source shift.

**C2 — Cash Variance Report**

**Purpose:** Shows every shift's shortage or excess, side by side, so a pattern (one staff member always ₨200 short) becomes visible in seconds instead of buried across dozens of separate shift reports.

**What You See First:** Today's Total Variance (net across all shifts), This Month's Total Variance, Worst-Variance Staff Member This Month (name + amount).

**Drill-Down:** Level 2 — variance by staff member, ranked worst-to-best. Level 3 — every individual shift for that staff member with its exact variance amount and the reason they entered (if any).

**C3 — Credit Given Today (Aaj Ka Udhaar)**

**Purpose:** A same-day view of every credit/udhaar transaction given out today specifically — separate from the full Customer Ledger (see L) because "what did we give out today" is a different daily question than "what does this customer owe in total."

**What You See First:** Total Credit Given Today (₨), Number of Customers Given Credit Today, Largest Single Credit Entry Today.

**Drill-Down:** Level 2 — list of customers who received credit today. Level 3 — the specific shift and amount for each.

**Filters (all three C reports):** Date range, staff member, branch.

**Who Uses This:** Owner (checks Cash Book and Variance daily, often the very first and last thing they check), Manager.

**Real-Time Data Source:** `stations/{stationId}/ledgerEntries` (ledgerType `cash`) for C1; `stations/{stationId}/shifts` field `varianceAmount` aggregated live for C2; `ledgerEntries` (ledgerType `customer`, `sourceType == "shift"`, filtered to today's date) for C3.

---

### D — Daily Report Summary & Digital Cash Ledger

**D1 — Daily Report Summary**

**Purpose:** The historical version of "A" — instead of only showing today, this lets the owner pick **any single past day** and see that day's complete story: liters sold, sales value, cash position, expenses, staff on duty, and any flags — exactly the format of a traditional end-of-day register page, digitized.

**What You See First:** Date picker (defaults to yesterday), then the same 6-card grid as "A" but for the selected date.

**Drill-Down:** Level 2 — same shortcuts into other reports, scoped to that date. Level 3 — individual shift summaries for that date.

**D2 — Digital Cash Ledger (JazzCash / EasyPaisa / RAAST)**

**Purpose:** Same structure as "B — Bank Cash Ledger" but for digital wallets specifically, since these are reconciled differently (wallet apps, not bank statements) and owners think of them as a separate "bucket" of money.

**What You See First:** Total Digital Balance (per wallet type), Today's Digital Collections.

**Drill-Down:** Level 2 — per wallet type (JazzCash total, EasyPaisa total, RAAST total). Level 3 — individual shift-sourced entries.

**Filters:** Date (D1), date range + wallet type (D2).

**Who Uses This:** Owner, Manager, Accountant.

**Real-Time Data Source:** `stations/{stationId}/dailySnapshots/{date}` — a pre-aggregated document written once per day by a scheduled Cloud Function (for D1, so old days load instantly without re-summing every shift); `ledgerEntries` (ledgerType `digital`) live-queried for D2.

---

### E — Expenses (Categories, Monthly, Yearly, Budget)

**Purpose:** Exactly as requested — this is the report Umar specifically described: categories, KPI cards, drill-down, monthly and yearly views, all in one place.

**What You See First (KPI Cards):**
1. This Month's Total Expenses (₨)
2. Biggest Expense Category This Month (name + amount)
3. Budget Used This Month (%, with a small gauge — e.g., "72% of monthly budget used")
4. Compared to Last Month (↑/↓ percentage)

**Drill-Down Path:**
- Level 2: Every expense category as its own card (Staff Food, Maintenance, Transport, Utilities, Salaries, Misc, and any custom categories the owner has added) — each showing that category's total for the selected period and a mini progress bar against its budget
- Level 3: Every individual expense entry within that category — date, amount, description, who entered it, receipt photo thumbnail if attached, and whether it came from a Shift Wizard entry or a manual/recurring entry

**Filters Available:** Month/Year toggle, custom date range, category, "Shift-sourced only" vs. "Manual only" vs. "Both."

**Charts:** A simple bar chart (not a complex multi-series chart) — one bar per category, tallest to shortest, for the selected period. A second simple line showing month-by-month total expenses for the trailing 12 months, so a trend is visible without needing to read numbers.

**Who Uses This:** Owner (monthly budget review), Manager (approves/monitors), Accountant (categorized export for filing).

**Real-Time Data Source:** `stations/{stationId}/ledgerEntries` where `ledgerType == "expense"`, grouped by `categoryId`, with budget figures pulled from `stations/{stationId}/expenseCategories/{categoryId}.monthlyBudget`.

---

### F — Fuel Sales Report

**Purpose:** The core sales story — how much fuel, of which product, was sold, and what it was worth — separate from "S — Sales" (which is broader and includes cash/profit context) because Umar's own example separated "Sales" (S) from what is fundamentally the fuel-specific volume story here.

**What You See First:** Total Liters Sold (period), Petrol Liters, Diesel Liters, CNG Liters (or whichever products this station carries) as separate mini-cards, and Total Fuel Sales Value.

**Drill-Down:** Level 2 — per product type, per nozzle breakdown (which nozzle sold the most, useful for spotting a slow or malfunctioning nozzle). Level 3 — per-shift entries for that nozzle, each showing the exact Previous Reading → Current Reading pair that produced the liters figure (this links directly to "M — Meter Readings" for full audit detail).

**Filters:** Date range, product type, specific nozzle/tank, specific shift.

**Who Uses This:** Owner, Manager.

**Real-Time Data Source:** `stations/{stationId}/shiftReadings`, aggregated by `productType` and `nozzleId`, live via `onSnapshot`.

---

### G — General Ledger (Sab Kuch Aik Jaga)

**Purpose:** The "everything, unfiltered" report — every financial entry the business has ever recorded, in one chronological list, for the rare moment an owner or accountant needs to see the complete unfiltered truth rather than a specific category.

**What You See First:** Running Balance (as of now), Total Entries This Month, quick filter chips for each ledger type (Cash/Bank/Digital/Customer/Supplier/Expense) sitting right under the header for fast narrowing.

**Drill-Down:** Level 2 — filtered by whichever ledger-type chip is tapped. Level 3 — the specific entry, always with a "View Source Shift" link when applicable.

**Filters:** Date range, ledger type, source type (shift/manual/opening balance), amount range.

**Who Uses This:** Accountant (primary user — this is their "give me everything" report), Owner (occasionally, for audit purposes).

**Real-Time Data Source:** `stations/{stationId}/ledgerEntries`, unfiltered, ordered by `entryDate` descending.

---

### H — History: Purchase History (Supplier Deliveries Over Time)

**Purpose:** As specifically requested — a report showing the complete history of fuel purchased from suppliers, so an owner can see buying patterns, price trends paid to suppliers, and delivery frequency at a glance.

**What You See First:** Total Liters Purchased (period), Total Amount Paid to Suppliers (period), Average Cost Per Liter Paid (period), Number of Deliveries.

**Drill-Down:** Level 2 — per supplier (PSO, Attock, Shell, etc.), showing that supplier's total volume and spend. Level 3 — every individual invoice from that supplier: date, liters, product, base amount, delivery charges (shown separately or bundled per that supplier's invoice-type setting), and payment status.

**Filters:** Date range, supplier, product type, payment status (paid/unpaid/partial).

**Charts:** A simple line chart showing cost-per-liter paid to each supplier over time — this is the chart an owner actually wants, because it tells them whether their buying cost is creeping up.

**Who Uses This:** Owner (negotiating leverage with suppliers), Accountant.

**Real-Time Data Source:** `stations/{stationId}/supplierInvoices`, joined with `stations/{stationId}/suppliers` for names, live-queried.

---

### I — Inventory & Stock Report

**Purpose:** As specifically requested ("Stock...") — shows exactly how much fuel is physically in each tank, right now, and how that's trending.

**What You See First:** One Gauge card per tank (the signature circular fuel-gauge widget), showing current fill percentage, liters remaining, and a color cue (green = healthy, amber = approaching reorder level, red = below reorder level).

**Drill-Down:** Level 2 — tap a tank's gauge to see its stock history over the selected period (a simple area chart showing the sawtooth pattern of gradual depletion + periodic refills). Level 3 — the individual events that moved stock: each shift's deduction, each supplier delivery's addition.

**Filters:** Date range, specific tank, product type.

**Who Uses This:** Owner, Manager (daily reorder decisions).

**Real-Time Data Source:** `stations/{stationId}/tanks/{tankId}.currentStockLiters`, updated live via the Sync Engine's fan-out Cloud Function on every shift submission and every recorded supplier delivery.

---

### J — Journal: Manual Entries Report

**Purpose:** A dedicated, transparent list of every entry in the entire system that was **not** generated by a shift — opening balances, rent, one-off adjustments — so nothing "manual" ever hides inside a bigger report unlabeled. This report exists purely for trust: an owner or accountant can always answer "what did a human type in by hand, versus what the system calculated itself?"

**What You See First:** Total Manual Entries This Month (count and ₨ value), broken into Opening Balances / Adjustments / Recurring Expenses / Other.

**Drill-Down:** Level 2 — by entry type. Level 3 — the specific entry, who created it, and when.

**Filters:** Date range, entry type, created-by staff member.

**Who Uses This:** Accountant, Owner (periodic trust/audit check).

**Real-Time Data Source:** `stations/{stationId}/ledgerEntries` where `sourceType != "shift"`.

---

### K — KPI Dashboard (Owner's Quick View)

**Purpose:** Distinct from "A" (which is strictly "today") — this is a **configurable** dashboard where the Owner picks their own favorite 4-8 KPIs from across every other report in this module and pins them to one screen, viewable for any period they choose (not locked to "today").

**What You See First:** Whatever the Owner has pinned — defaults to Total Sales, True Profit, Cash Position, Outstanding Customer Credit, Outstanding Supplier Payments, Total Expenses if nothing has been customized yet.

**Drill-Down:** Every pinned card taps through into its full source report, same as "A."

**Filters:** A single master date-range selector that applies to every pinned card simultaneously.

**Who Uses This:** Owner exclusively — this is explicitly the "I only have 30 seconds, what's my business doing this week" screen.

**Real-Time Data Source:** Reads from each underlying report's live data source; the "which KPIs are pinned" configuration itself lives in `stations/{stationId}/users/{userId}/dashboardConfig`.

---

### L — Ledgers: Customer Ledger & Supplier Ledger

**L1 — Customer Ledger**

**Purpose:** As specifically requested — every customer's individual running account, all in one place, easy enough that a salesman can look a customer in the eye and tell them exactly what they owe.

**What You See First:** Total Outstanding Across All Customers (₨), Number of Customers with a Balance, Biggest Debtor (name + amount), This Month's Total Recoveries.

**Drill-Down:** Level 2 — list of all customers with a balance, sorted highest-owed first, each row color-banded by how overdue their oldest debt is (green <30 days, amber 30-60, red 60+). Level 3 — tap a customer to see their complete individual ledger: every credit given, every recovery, running balance after each, with a WhatsApp reminder button right there.

**L2 — Supplier Ledger**

**Purpose:** The mirror image — what the station owes each supplier.

**What You See First:** Total Owed to All Suppliers (₨), Number of Suppliers with a Balance, Next Payment Due (if invoice due dates are tracked).

**Drill-Down:** Level 2 — list of suppliers with a balance. Level 3 — individual supplier's full invoice + payment history.

**Filters (both):** Date range, search by name, balance-amount range, aging bucket.

**Who Uses This:** Owner, Manager, Accountant.

**Real-Time Data Source:** `stations/{stationId}/customers` / `stations/{stationId}/suppliers` for current balances (updated live by the Sync Engine), joined with `ledgerEntries` filtered by `referenceId` for full history.

---

### M — Meter Readings Report (Previous → Current, Per Shift, Per Nozzle)

**Purpose:** As specifically requested — "readings se le kar cash tak" — this is the readings half of that journey, and it is the most detail-rich report in the entire module because it is the foundation everything else is built on (see the Master Reading-Centric PRD for why).

**What You See First:** Today's Total Readings Taken (count of nozzle-shift pairs), Any Reading Discontinuity Flags (count, red if >0), Any Meter-Changed Events This Month.

**Drill-Down:** Level 2 — per nozzle, showing a simple chronological list: each shift's Previous Reading, Current Reading, Liters Sold, and the operator who recorded it. Level 3 — tap any single reading pair to see full detail: exact timestamp, GPS-tagged if captured, photo of the meter face if one was taken, and (if applicable) the discontinuity/meter-changed flag with its override reason and who approved it.

**Filters:** Date range, specific nozzle, specific staff member, "flagged only" toggle.

**Who Uses This:** Owner (spot-checks, dispute resolution), Manager (daily verification).

**Real-Time Data Source:** `stations/{stationId}/shiftReadings` plus `stations/{stationId}/nozzleReadingAuditLog` (the permanent, append-only chain described in the Reading-Centric Master PRD) for the flagged/discontinuity detail.

---

### N — Nozzle & Pump Performance Report

**Purpose:** Answers "which nozzle/pump is actually earning money for me, and is any of them underperforming or possibly malfunctioning?"

**What You See First:** One card per nozzle showing total liters sold this period, ranked highest to lowest.

**Drill-Down:** Level 2 — a comparison chart across all nozzles for the selected period. Level 3 — that nozzle's individual shift history (same as drilling from "M").

**Filters:** Date range, tank/product group.

**Who Uses This:** Owner, Manager (maintenance planning — a nozzle trending down might need calibration).

**Real-Time Data Source:** Same `shiftReadings` collection as "F" and "M," aggregated by `nozzleId`.

---

### O — Outstanding & Overdue (Customer Aging & Supplier Aging, Consolidated)

**Purpose:** While "L" shows each customer/supplier's own ledger, "O" is the consolidated, station-wide aging view — the report an owner opens before deciding "who do I need to call about money this week."

**What You See First:** Total Customer Overdue >60 days (₨), Total Supplier Payments Due This Week (₨).

**Drill-Down:** Level 2 — aging bucket breakdown (0-30/30-60/60-90/90+) for customers, and due-this-week/due-this-month for suppliers. Level 3 — the specific customers/suppliers in that bucket, tap-through to their full ledger (same destination as "L" Level 3).

**Filters:** Aging bucket, amount threshold.

**Who Uses This:** Owner (weekly recovery/payment planning session).

**Real-Time Data Source:** Computed live from `customers`/`suppliers` current balances plus a FIFO-aging Cloud Function that runs nightly and caches bucket assignments to `stations/{stationId}/agingSnapshot/{date}` for fast loading.

---

### P — Profit (True Profit Engine) & Purchase Spend

**P1 — True Profit Report**

**Purpose:** The single number every owner actually opens the app to find — "did I make money, and how much."

**What You See First:** True Profit This Period (large, center, green/red), with the exact waterfall breakdown directly beneath it: Gross Sales Value → minus Purchase Cost → minus Test Liter Loss → minus Credit Aging Cost → minus Operating Expenses → **True Profit**. Every step of the subtraction shown as its own small line so nothing is a "black box."

**Drill-Down:** Level 2 — each waterfall component becomes its own tappable row leading into its own detailed report (Purchase Cost → "H", Test Liter Loss → a filtered view of "M", Operating Expenses → "E"). Level 3 — same as those underlying reports' Level 3.

**P2 — Purchase Spend Summary**

**Purpose:** A simpler, single-number version of "H" for a quick "how much did I spend buying fuel this month" check without the full history detail.

**What You See First:** Total Purchase Spend (period), compared to Total Sales Value (period) as a simple side-by-side.

**Filters (both):** Date range (Monthly/Yearly toggle prominent, since profit is almost always reviewed on those two cycles specifically).

**Who Uses This:** Owner exclusively (P1 is arguably the most important single screen in the entire app after the Shift Wizard itself).

**Real-Time Data Source:** A Cloud Function-computed `stations/{stationId}/profitSnapshot/{period}` document, recalculated on every relevant underlying change (new shift, new expense, new supplier invoice) so the Owner never sees a stale profit figure.

---

### Q — Quick Comparison Reports (This Period vs. Last Period)

**Purpose:** Every owner's instinctive question is comparative — "is this month better or worse than last month?" — so rather than making them mentally subtract two separate report screens, this report does the comparison natively.

**What You See First:** Side-by-side twin KPI cards for: Sales, Profit, Expenses, Cash Position — This Month vs. Last Month, This Year vs. Last Year (toggle between the two comparison modes), each pair with a clear ↑/↓ percentage between them.

**Drill-Down:** Level 2 — a comparison bar chart across the last 6 periods for whichever metric is tapped. Level 3 — same destination as that metric's own home report.

**Filters:** Metric selector, Monthly/Yearly comparison toggle.

**Who Uses This:** Owner (weekly/monthly business review habit).

**Real-Time Data Source:** Reads from the same `dailySnapshots` and `profitSnapshot` pre-aggregated documents used elsewhere, simply queried for two adjacent periods and diffed client-side.

---

### R — Rate Change History & Recoveries Report

**R1 — Rate Change History (Product Rate Log)**

**Purpose:** As specifically requested ("rate change") — a simple, dated log of every time the pump price for each product changed, since prices in Pakistan move frequently and owners need to be able to answer "at what rate were we selling on the 14th of last month?" for dispute or audit purposes.

**What You See First:** Current Rate per product (large cards, Petrol/Diesel/CNG), Last Changed date/time for each.

**Drill-Down:** Level 2 — full chronological history of rate changes for a selected product. Level 3 — who changed it, exact old rate → new rate, and effective timestamp.

**R2 — Recoveries Report (Udhaar Wapsi)**

**Purpose:** As specifically requested — separate from "C3" (which is about credit given out), this is specifically about money **collected back** from customers who owed it.

**What You See First:** Total Recovered This Period (₨), Number of Customers Who Paid, Biggest Single Recovery.

**Drill-Down:** Level 2 — per customer, per staff-member-who-collected-it. Level 3 — the specific shift/recovery entry.

**Filters (both):** Date range; R1 additionally by product; R2 additionally by staff member or customer.

**Who Uses This:** Owner (R1 for pricing/dispute history, R2 for recovery-effort tracking), Manager.

**Real-Time Data Source:** `stations/{stationId}/productRates` (append-only history, never overwritten) for R1; `ledgerEntries` (ledgerType `customer`, credit entries with `sourceType shift_recovery`) for R2.

---

### S — Sales, Staff, Supplier Payments, Shift Logs, Stock (Exactly As Requested)

This letter deliberately carries the heaviest load in the entire alphabet, mirroring the structure Umar specifically laid out (S, S1, and so on) — five full sub-reports live here.

**S — Sales Report (the parent)**

**Purpose:** The broad commercial story: liters, revenue, and — because Umar explicitly asked for this combination — cash and profit context sitting alongside the volume numbers, not siloed away in separate letters only.

**What You See First:** Total Liters Sold, Total Sales Value, Actual Cash Collected (vs. Expected), Profit Margin % for the period.

**Drill-Down:** Level 2 — by product, by day-of-week pattern (a simple bar showing which days are historically busiest — useful for staffing decisions). Level 3 — individual shift entries.

**S1 — Staff Report**

**Purpose:** Exactly as requested — salaries, attendance, performance, and shifts, all in one staff-focused view.

**What You See First:** One card per staff member: Shifts Worked (period), Average Variance, Attendance %, Reliability Score.

**Drill-Down:** Level 2 — tap a staff member for their individual salary calculation (base pay, attendance-based adjustment, final approved amount), attendance calendar, and shift history list. Level 3 — the individual shift record itself.

**S2 — Shift Logs**

**Purpose:** As specifically requested — a complete, filterable list of every shift ever run at the station, the master index that every other report's "Level 3, view source shift" link ultimately points into.

**What You See First:** Today's Shifts (list, live-updating as they open/close), with status badges (In Progress / Submitted / Needs Review).

**Drill-Down:** Level 2 — filtered/historical shift list. Level 3 — the full Shift Wizard Step 1-9 summary for that specific shift, read-only.

**S3 — Supplier Payments Report**

**Purpose:** As specifically requested — distinct from the full Supplier Ledger (L2, which shows the running balance story), this is a pure payments-made view: "how much cash/bank/digital did we actually hand over to suppliers, and when."

**What You See First:** Total Paid to Suppliers This Period, Payment Mode Breakdown (Cash/Bank/Digital as three mini-slices).

**Drill-Down:** Level 2 — per supplier. Level 3 — individual payment entries, each linked to its shift and its invoice.

**S4 — Stock Report**

**Purpose:** As specifically requested — this is intentionally a lightweight cross-link to the full "I — Inventory & Stock Report" rather than a duplicate build, since Umar mentioned "Stock" both generally and within the S-cluster — the app simply places a shortcut card here so it's discoverable from either alphabetical direction.

**Filters (S2, S3):** Date range, staff member, payment mode, shift status.

**Who Uses This:** Owner and Manager use all five; Accountant uses S3 primarily.

**Real-Time Data Source:** `stations/{stationId}/shifts` (S, S2), `stations/{stationId}/staff` joined with `staffAttendance` (S1), `stations/{stationId}/shiftSupplierPayments` (S3), cross-link to Inventory's Firestore path (S4).

---

### T — Tax, Tank, Test Liters

**T1 — Tax / OGRA Compliance Report**

**Purpose:** GST, FED (Federal Excise Duty), and Petroleum Levy broken down per product, formatted for handing to a tax filer — not a filing submission itself, but everything they'd need.

**What You See First:** Total Tax Component This Period (₨), broken into the three sub-categories as mini-cards.

**Drill-Down:** Level 2 — per product, per tax type. Level 3 — the underlying liters figures the tax was calculated from (links back to "F").

**T2 — Tank Report (Dip, Water Check, Density)**

**Purpose:** The deeper operational tank-health data (distinct from "I," which is pure stock-level tracking) — dip readings, water contamination checks, temperature, and density logs for stations that perform these manual checks.

**What You See First:** Last Dip Reading per tank, Last Water Check status (Pass/Fail, date).

**Drill-Down:** Level 2 — history of dip/water/density checks per tank. Level 3 — the individual check entry, who performed it, and any photo evidence.

**T3 — Test Liters Report**

**Purpose:** As emphasized throughout the product's core philosophy — calibration/test liters tracked on their own, never merged into shrinkage.

**What You See First:** Total Test Liters This Period, as a % of Total Gross Liters (with a clear "healthy range" indicator, e.g., under 1% is normal, flagged if higher).

**Drill-Down:** Level 2 — per nozzle. Level 3 — individual test-liter entries with their stated reason (Scheduled Calibration / OGRA Inspection / Customer Dispute Check / Other).

**Filters (all three):** Date range; T1 additionally by product; T2 additionally by tank; T3 additionally by nozzle/reason.

**Who Uses This:** Accountant (T1), Owner/Manager (T2, T3 — operational health and fraud-prevention checks).

**Real-Time Data Source:** `stations/{stationId}/taxRates` joined with sales volume (T1), `stations/{stationId}/tankChecks` (T2), `stations/{stationId}/shiftTestLiters` (T3).

---

### U — Udhaar Summary (Customer Credit, Station-Wide Snapshot)

**Purpose:** A single-screen, no-drill-down-needed, "just tell me the credit situation right now" report — deliberately simpler than "L1" for the moment an owner just wants the headline without navigating into individual customers.

**What You See First:** Total Outstanding (₨), This Month's Credit Given, This Month's Recovered, Net Change (up or down).

**Drill-Down:** One tap takes the user straight into "L1" for full detail — this report exists purely as a fast-glance summary layer above it.

**Filters:** Date range only.

**Who Uses This:** Owner (fastest possible credit-health check).

**Real-Time Data Source:** Same as L1, pre-aggregated.

---

### V — Variance Report (Station-Wide Trend, All Shifts)

**Purpose:** Distinct from "C2" (which is about individual staff comparison) — this is the **trend-over-time** view, answering "is our overall cash discipline getting better or worse as a business, regardless of who's on shift."

**What You See First:** Variance Trend Line (last 30 days, net variance per day), Total Net Variance This Month.

**Drill-Down:** Level 2 — variance by day-of-week pattern (are Fridays worse than Mondays?). Level 3 — same individual shift entries as "C2."

**Filters:** Date range, branch (if multi-branch).

**Who Uses This:** Owner (macro trend-watching, separate from the micro staff-blame question C2 answers).

**Real-Time Data Source:** `stations/{stationId}/shifts.varianceAmount`, aggregated by date via a scheduled rollup.

---

### W — Wages/Salary Report & WhatsApp Share Log

**W1 — Wages/Salary Report**

**Purpose:** A dedicated financial view of the salary side of "S1 — Staff," specifically for the Owner's monthly payroll decision moment, separated out because payroll is a distinct monthly ritual from daily staff performance monitoring.

**What You See First:** Total Salary Bill This Month (₨), Number of Staff Pending Approval.

**Drill-Down:** Level 2 — per staff member, base pay vs. attendance-adjusted suggested pay vs. final approved pay. Level 3 — the individual attendance calendar behind that calculation.

**W2 — WhatsApp Share Log**

**Purpose:** A simple, honest log of every report/reminder that has been shared out via WhatsApp from the app (customer balance reminders, daily summaries sent to an accountant, etc.) — so an owner always knows what's been communicated to whom.

**What You See First:** Messages Sent Today, Messages Sent This Month.

**Drill-Down:** Level 2 — by recipient type (customers vs. accountant/other). Level 3 — the specific message content and timestamp.

**Filters (both):** Date range; W1 additionally by staff; W2 additionally by recipient.

**Who Uses This:** Owner (both), Accountant (W1 for payroll processing).

**Real-Time Data Source:** `stations/{stationId}/staff` + `staffAttendance` (W1, shared with S1); a lightweight `stations/{stationId}/shareLog` collection written whenever the app's native share sheet is invoked from any report (W2).

---

### X — X-Report (Live Shift Snapshot — Non-Final, Mid-Shift Check)

**Purpose:** Borrowed deliberately from classic retail/POS terminology — an "X-Report" is a **non-resetting, in-progress snapshot** — this lets a Manager peek at an active, not-yet-closed shift's running numbers (liters so far, cash counted so far) without disturbing or finalizing anything, useful for a mid-shift spot-check.

**What You See First:** For each currently active shift: Liters Sold So Far, Cash/Bank/Digital Collected So Far, Elapsed Time.

**Drill-Down:** Level 2 — the specific active shift's live Step-by-step progress (which Shift Wizard step the cashier is currently on). No Level 3 — this is inherently a live, in-the-moment view, not a historical archive.

**Filters:** Branch (if multi-branch), specific active shift.

**Who Uses This:** Owner, Manager (spot-checking a shift in progress, especially useful for remote owners who aren't physically at the station).

**Real-Time Data Source:** `stations/{stationId}/shifts` where `status == "in_progress"`, live via `onSnapshot` — this is the most real-time report in the entire module, updating within the same second a cashier types a new number into the Shift Wizard.

---

### Y — Yearly Annual Report

**Purpose:** As specifically requested — the full-year rollup, formatted cleanly enough to hand directly to an accountant or use as a year-end business review with family/partners.

**What You See First:** Total Annual Sales, Total Annual Profit, Total Annual Expenses, Year-over-Year Growth % (vs. the previous full year, if history exists).

**Drill-Down:** Level 2 — month-by-month breakdown within the year (a clean 12-bar chart). Level 3 — tapping any month drops into that month's "D1 — Daily Report Summary" equivalent at the monthly level.

**Filters:** Year selector (dropdown of all years the station has operated).

**Who Uses This:** Owner (annual review), Accountant (year-end tax filing prep).

**Real-Time Data Source:** `stations/{stationId}/yearlySnapshot/{year}` — computed and cached by a scheduled Cloud Function each night, with the current (incomplete) year computed live by summing the year's `dailySnapshots`.

---

### Z — Z-Report (End-of-Day Final Closing Summary)

**Purpose:** Also borrowed deliberately from classic retail/POS terminology — where an "X-Report" is a peek without resetting, a **"Z-Report" is the final, official, end-of-day closing summary** — the digital equivalent of the last page a station manager used to sign and file every night, now generated automatically the moment the last shift of the day closes.

**What You See First:** A single, clean, printable/shareable one-page summary: Date, Total Liters Sold (all products), Total Sales Value, Total Cash/Bank/Digital/Credit breakdown, Total Expenses, Net Cash Variance for the day, Staff who worked, and a final "Day Status" badge (Clean / Needs Review).

**Drill-Down:** This report is intentionally **flat — no drill-down at all.** It is meant to be the final, printed-feeling, one-screen artifact of the day, not a jumping-off point into other reports (a user wanting more detail simply goes to the relevant letter elsewhere in the A-Z menu). It exists to be **shared** — one tap generates a branded PDF and opens the native share sheet, pre-addressed to WhatsApp.

**Filters:** Date picker to view any past day's Z-Report (each day's Z-Report, once generated, is permanently archived and never recalculated retroactively — even if a later correction is made to that day's records, the original Z-Report stands as the historical record, with any correction appearing in the following day's Journal, per "J").

**Who Uses This:** Owner (the literal last thing checked before ending the day), Accountant (archival record).

**Real-Time Data Source:** `stations/{stationId}/zReports/{date}` — generated once by a Cloud Function triggered when the last shift of a calendar day transitions to `submitted` or `needs_review`, then frozen/immutable.

---

## PART 3 — REAL-TIME FIREBASE ARCHITECTURE (No Fake Data, Ever)

### 3.1 Why Firebase Realtime Data Is a Product Requirement, Not an Implementation Detail
An owner who is not physically at the station must be able to trust that the number on their screen right now reflects reality right now. Every report in Part 2 is backed by either:
- A **live Firestore `onSnapshot` listener** for anything showing "in progress" or "today" data (A, C2/C3 live portion, X, the live half of Y), which pushes updates to the screen the instant the underlying document changes — no pull-to-refresh required, no polling delay.
- A **Cloud Function-maintained pre-aggregated snapshot document** for anything historical (D1, yearlySnapshot, profitSnapshot, agingSnapshot, zReports) — these are written once, at the moment they become "finalized" (end of day, end of year, shift submission), and never silently recalculated in a way that could make yesterday's Z-Report look different tomorrow than it did today.

### 3.2 Zero-Dummy-Data Rule (Enforced, Not Just Promised)
- Production Firebase project and development/staging Firebase project are **physically separate projects** with separate credentials — there is no code path, feature flag, or debug mode that can point a real station's app build at a sandbox database.
- Any seeded/test data used during development lives exclusively in the staging project and is additionally prefixed (e.g., `TEST_` document IDs) so an accidental cross-environment query is immediately, visibly obvious rather than silently blending fake numbers into a report.
- Every report screen, in a rare zero-data state (e.g., a brand-new station with no shifts yet), shows an honest, clearly-labeled **empty state** ("Abhi tak koi shift record nahi hai — pehli shift shuru karein" / "No shifts recorded yet — start your first shift") — never a placeholder chart with invented-looking numbers.

### 3.3 Data Integrity Chain
Every number surfaced in every report in Part 2 traces back, through no more than two hops, to either a `shiftReadings` document (for anything fuel/liters-related) or a `ledgerEntries` document (for anything financial) — both of which are, per the Reading-Centric Master PRD, generated exclusively through the audited Shift Wizard fan-out process or an explicitly-tagged manual entry. **No report in this module ever independently calculates or estimates a number that isn't traceable to one of these two authoritative sources.**

### 3.4 Offline Behavior for Reports
Firestore's native offline persistence is enabled, so any report a user has previously opened while online remains viewable (with a small "Last updated: {time}, showing cached data" banner) if they reopen it while offline — but no report **misleads** the user into thinking cached data is live; the banner is mandatory and cannot be dismissed permanently.

---

## PART 4 — CROSS-CUTTING FEATURES (Apply to Every Single Report Above)

- **Universal Date Range Selector:** One shared component (Today / Yesterday / This Week / This Month / This Year / Custom Range) used identically across all 26+ reports, so the muscle memory transfers everywhere.
- **Universal Export:** Every report has a share icon in the same top-right position, generating a branded PDF (station logo/name/address header) and a raw Excel/CSV, both delivered via the native share sheet with WhatsApp pre-selected as the top suggestion (the dominant real-world sharing channel for this user base).
- **Universal Search:** The A-Z menu's search bar also searches *within* a report's Level 3 detail once inside it (e.g., inside Customer Ledger, typing a name filters the list instantly).
- **Universal "View Source Shift" Link:** Any line-item anywhere that originated from a shift carries the exact same button style and destination screen, so users learn this pattern once and it works everywhere in the module.
- **Consistent Color Language:** Green = healthy/good/on-target. Amber = watch/approaching a limit. Red = needs attention/over a limit/shortage. This mapping never changes meaning between reports.

---

## PART 5 — ROLE-BASED VISIBILITY ACROSS THE REPORTS MODULE

| Report Group | Owner | Manager | Cashier | Accountant |
|---|---|---|---|---|
| A, D, K, Q, Y, Z (Dashboards/Summaries) | ✅ | ✅ | ❌ | ✅ (view) |
| B, D2, C1 (Cash/Bank/Digital Ledgers) | ✅ | ✅ | ❌ | ✅ |
| C2, C3, V (Variance/Credit-Given) | ✅ | ✅ | ❌ | ❌ |
| E, J (Expenses/Manual Entries) | ✅ | ✅ (view) | ❌ | ✅ |
| F, I, M, N, T2, T3 (Fuel/Stock/Readings/Tank) | ✅ | ✅ | ❌ | ❌ |
| G (General Ledger) | ✅ | ❌ | ❌ | ✅ |
| H, P2 (Purchase/Supplier Spend) | ✅ | ✅ (view) | ❌ | ✅ |
| L1, U (Customer Ledger/Udhaar) | ✅ | ✅ | ❌ | ✅ (view) |
| L2, S3 (Supplier Ledger/Payments) | ✅ | ✅ | ❌ | ✅ |
| O (Aging) | ✅ | ✅ | ❌ | ✅ (view) |
| P1 (True Profit) | ✅ | ❌ | ❌ | ❌ |
| R1 (Rate Change History) | ✅ | ✅ | ❌ | ❌ |
| R2 (Recoveries) | ✅ | ✅ | ❌ | ❌ |
| S, S2 (Sales/Shift Logs) | ✅ | ✅ | ❌ (own shifts only) | ✅ (view) |
| S1, W1 (Staff/Salary) | ✅ | ❌ | ❌ | ✅ (payroll view) |
| T1 (Tax/OGRA) | ✅ | ❌ | ❌ | ✅ |
| W2 (WhatsApp Log) | ✅ | ✅ | ❌ | ❌ |
| X (Live Shift Snapshot) | ✅ | ✅ | ❌ | ❌ |

**True Profit (P1) is deliberately the single most restricted report in the entire module — Owner-only, no exceptions, since actual profitability is the one figure a station owner in Pakistan almost universally wants kept private even from a trusted manager.**

---

## PART 6 — NON-FUNCTIONAL REQUIREMENTS

- **Load time:** Every report's Level 1 (KPI cards) must render in under 1.5 seconds on a low-end Android device with average 3G-equivalent connectivity, using cached/pre-aggregated data wherever the report is historical rather than live.
- **Accuracy over speed when the two conflict:** Live reports (A, X, C2/C3-today, D2) prioritize correctness of the `onSnapshot` listener over minimizing Firestore read costs — this module is explicitly exempted from aggressive read-optimization if it would risk showing a stale number.
- **Consistent iconography and card sizing** across all 26+ reports, built from one shared component library, so no report ever "looks different" from the others in a way that makes it feel like a bolted-on afterthought.
- **Full bilingual coverage** — every single label, KPI card title, and empty-state message in every report exists in both Urdu and English from day one; no report ships English-only "temporarily."

---

## PART 7 — ACCEPTANCE CRITERIA

- [ ] All 26 letters (A-Z) are present in the Reports menu, searchable, and each opens to the correct KPI-card-first Level 1 view
- [ ] Every report's numbers are independently verifiable against the underlying `shiftReadings`/`ledgerEntries` Firestore data with zero discrepancy
- [ ] No report anywhere in the module ever displays a hardcoded, placeholder, or "coming soon with sample data" number in production
- [ ] Live reports (A, X, today's-scope of C2/C3/D2) update on-screen within 2 seconds of the underlying Firestore document changing, with no manual refresh needed
- [ ] Every report correctly restricts visibility per the Part 5 role matrix, verified by logging in as each of the four roles
- [ ] Every report's export (PDF/Excel) correctly reflects the currently applied filters, not the full unfiltered dataset
- [ ] A matric-pass test user (no prior app experience) can, within a 10-minute guided walkthrough, independently locate and correctly interpret at least 5 of the reports above without further help — this is the definitive usability bar for the entire module, tested with real staff before launch, not assumed from design principles alone

---

**اختتامیہ: یہ Reports Module صرف نمبر دکھانے کے لیے نہیں بنایا — یہ اُس اعتماد کے لیے بنایا ہے جو ایک مالک کو اپنے اسٹیشن پر، اور ایک سیلز مین کو اپنے کام پر، ہر روز دوبارہ حاصل ہونا چاہیے۔**

---

## PART 8 — DETAILED FIRESTORE SCHEMA REFERENCE (For the Development Team)

This section exists so the developer building this module never has to guess a field name or collection path. Every path below uses the same `stations/{stationId}/...` tenant-scoped root established elsewhere in the FuelPro architecture.

### 8.1 `stations/{stationId}/liveDashboard` (backs Report A)
```json
{
  "date": "2026-08-02",
  "totalLitersToday": 4520.5,
  "totalSalesValueToday": 1583175,
  "cashPositionNow": 892400,
  "activeShiftsCount": 2,
  "todaysExpenses": 12500,
  "flaggedShiftsCount": 1,
  "lastUpdated": "2026-08-02T14:32:10Z"
}
```
Written by Cloud Function `onShiftStatusChange`, triggered on every write to `shifts/{shiftId}` where `status` transitions.

### 8.2 `stations/{stationId}/dailySnapshots/{date}` (backs Report D1, feeds Y)
```json
{
  "date": "2026-08-01",
  "totalLiters": { "petrol": 3200.0, "diesel": 1800.5, "cng": 900.0 },
  "totalSalesValue": 1620400,
  "cashCollected": 950000,
  "bankCollected": 400000,
  "digitalCollected": 150000,
  "creditGiven": 120400,
  "totalExpenses": 34500,
  "netVariance": -350,
  "shiftsCount": 4,
  "flaggedShiftsCount": 0,
  "staffOnDuty": ["staffId1", "staffId2"]
}
```
Written once nightly by scheduled Cloud Function `computeDailySnapshot`, triggered at 11:59 PM station-local time — never recalculated retroactively once written (a same-day correction appends a new Journal entry per Report J instead of mutating this document).

### 8.3 `stations/{stationId}/ledgerEntries/{entryId}` (backs B, C1, D2, E, G, J, L1, L2, S3)
```json
{
  "ledgerType": "customer",
  "referenceId": "customerId789",
  "sourceType": "shift",
  "sourceShiftId": "shiftId456",
  "entryDate": "2026-08-02T11:15:00Z",
  "description": "Credit given - Shift #456",
  "debit": 5000,
  "credit": 0,
  "runningBalance": 42000,
  "categoryId": null,
  "createdBy": "userId123"
}
```
This single collection, filtered by `ledgerType` and `referenceId`, is the backbone of nine separate reports across the A-Z menu — it is never duplicated per-report, only queried differently.

### 8.4 `stations/{stationId}/shiftReadings/{readingId}` (backs F, M, N, T3-linked)
```json
{
  "shiftId": "shiftId456",
  "nozzleId": "nozzleId12",
  "productType": "Petrol",
  "openingReading": 458213.5,
  "closingReading": 458350.2,
  "computedLitersSold": 136.7,
  "openingPhotoUrl": "gs://fuelpro-prod/readings/...",
  "closingPhotoUrl": "gs://fuelpro-prod/readings/...",
  "readingDiscontinuityFlag": false,
  "meterChangedFlag": false,
  "recordedBy": "staffId1",
  "recordedAt": "2026-08-02T18:40:00Z"
}
```

### 8.5 `stations/{stationId}/shifts/{shiftId}` (backs S2, S, X, V, C2)
```json
{
  "operatorStaffId": "staffId1",
  "assistantStaffIds": [],
  "shiftStartTime": "2026-08-02T06:00:00Z",
  "shiftEndTime": "2026-08-02T18:45:00Z",
  "status": "submitted",
  "varianceAmount": -350,
  "varianceReason": "Chai wala change nahi dey saka",
  "totalLitersSold": 890.4,
  "totalSalesValue": 312400,
  "totalCashCollected": 180000,
  "totalBankCollected": 90000,
  "totalDigitalCollected": 40000,
  "totalCreditGiven": 5000
}
```

### 8.6 `stations/{stationId}/profitSnapshot/{period}` (backs P1)
```json
{
  "period": "2026-08",
  "grossSalesValue": 45230000,
  "purchaseCost": 38900000,
  "testLiterLoss": 82400,
  "creditAgingCost": 12300,
  "operatingExpenses": 890000,
  "trueProfit": 5345300,
  "lastRecalculated": "2026-08-02T14:32:10Z"
}
```
Recalculated by Cloud Function `recomputeProfitSnapshot`, triggered on any write to `shiftReadings`, `ledgerEntries` (expense type), or `supplierInvoices` for the current period — ensuring Report P1 is never more than a few seconds stale.

### 8.7 `stations/{stationId}/zReports/{date}` (backs Z)
```json
{
  "date": "2026-08-01",
  "generatedAt": "2026-08-01T23:58:12Z",
  "isFinal": true,
  "summary": { "...": "mirrors dailySnapshot structure at time of generation, frozen" }
}
```
Once `isFinal: true` is set, this document is protected by a security rule that rejects any further write to it — the permanent, unchangeable record described in Report Z above.

---

## PART 9 — SCREEN-BY-SCREEN WIREFRAME NOTES (Text Description for the Design Team)

Since every report shares the same Level 1/2/3 skeleton (Part 1.3), the wireframe notes below describe the **one shared template** in full detail rather than repeating near-identical descriptions 26 times.

### 9.1 Level 1 — KPI Card Grid Screen
- **Top bar:** Report name (Urdu large, English small beneath), back arrow, share icon (top-right), date-range chip (tappable, opens the Universal Date Range Selector as a bottom sheet)
- **Body:** A 2-column grid of KPI cards (or 1-column on very small screens), each card: icon top-left, large monospace number center, short label beneath, small trend arrow + percentage top-right corner if a comparison is available for that metric
- **Bottom:** If the report has a Level 2 chart view (most do), a "See Breakdown" full-width button pinned above the bottom nav, always in the same position across every report

### 9.2 Level 2 — Breakdown/Category Screen
- **Top bar:** Same as Level 1, plus a secondary tab row if the report has multiple breakdown dimensions (e.g., Expenses can break down by Category or by Date — shown as two tabs)
- **Body:** Either a simple bar/pie chart (for reports where visual comparison matters — Expenses, Fuel Sales by product, Staff variance ranking) or a plain sorted list (for reports where reading exact names/amounts matters more than visual comparison — Customer Ledger, Supplier Ledger)
- Every row/bar is tappable, leading to Level 3

### 9.3 Level 3 — Line-Item Detail Screen
- **Top bar:** Breadcrumb showing the path taken (e.g., "Expenses > Maintenance > Aug 2"), so a user always knows how they got here and can back out cleanly
- **Body:** A simple, chronological list of individual entries — date, description, amount, a small tag showing source (shift number, tapped to jump to that shift's read-only summary, or "Manual" tag)
- **Empty state:** If a filtered Level 3 view has zero entries (e.g., a customer with a perfectly clean, zero-balance history), show a friendly confirming message ("Koi bhi udhaar nahi — sab theek hai!" / "No credit on record — all clear!") rather than a blank list, since an empty financial report should read as reassuring, not broken.

### 9.4 The Universal Date Range Selector (Bottom Sheet, Shared Component)
- Six quick-tap chips across the top: Today, Yesterday, This Week, This Month, This Year, Custom
- If Custom is tapped, a simple calendar picker appears (start date, end date) — no complex recurring-range or relative-date builder, since the target user does not think in those terms
- A "Compare to Previous Period" toggle beneath the chips, available on any report that supports comparison (Sales, Expenses, Profit, Cash Position) — when on, every KPI card on that report gains the trend-arrow-and-percentage treatment automatically

---

## PART 10 — WORKED EXAMPLE: A SALESMAN'S ACTUAL JOURNEY THROUGH THE MODULE

To make the abstract design principles concrete, here is exactly what happens when Imran, a matric-pass salesman recently promoted to shift supervisor, opens the Reports module for the first time to check yesterday's numbers before his manager arrives:

1. He opens the app, taps the Reports icon in the bottom nav.
2. He sees the A-Z menu with "My Frequent Reports" empty (first time using it) and the alphabet list beneath.
3. He doesn't know where to look, so he taps the search bar and types "kal" (yesterday) — nothing matches literally, so he instead scrolls to "D" and recognizes "Daily Report Summary" immediately because of the calendar icon.
4. He taps it, the date picker defaults to yesterday already (as specified in Report D1 above), and he sees six KPI cards instantly — no scrolling needed.
5. He sees "Cash Variance: -₨350" in amber. He doesn't know what "variance" means in English, but the Urdu label beneath it says "نقدی میں فرق" (difference in cash) and the color amber (not red) tells him it's a minor issue, not a crisis.
6. He taps that card. It takes him to Report C2, filtered to yesterday, and he sees his own name with the -₨350 next to it, along with the reason he typed in during shift close: "Chai wala change nahi dey saka" (the tea vendor couldn't give change).
7. He feels reassured — his honest explanation is visibly attached to the record, not hidden or judged. He backs out, satisfied, and reports to his manager that yesterday was "clean, small ₨350 change issue, already explained in the app" — a complete, confident answer, delivered in under 90 seconds, with zero training beyond this document's onboarding walkthrough.

This worked journey — not the KPI card grid alone — is the actual acceptance test for whether the Reports module has succeeded.

---

**PRD Continuation Note:** This Addendum, together with the main body of the FuelPro Enterprise Intelligence Platform A-to-Z PRD, constitutes the complete, single-source specification for this platform. Any future report added to the alphabet (should a gap be found later — a letter with no natural fit today, such as a dedicated "Q" beyond Quick Comparison, or a second "J" report) must follow the identical Purpose → KPI Cards → Drill-Down → Filters → Who Uses This → Real-Time Data Source template established throughout, and must register itself in the Engine Type Classification (Part 16), Formula Registry (Part 17), and Enterprise Metadata Registry (Part 20) — so the platform's internal consistency is never diluted as it grows.

---

## PART 11 — MULTI-BRANCH CONSOLIDATED REPORTING (For Owners With 2+ Stations)

Many FuelPro owners, including Association members who operate more than one station, need every report above to also work in a **consolidated, cross-branch view** — not as a separate module, but as an additional lens over the exact same 26 reports.

### 11.1 The Branch Switcher and "All Branches" Mode
Every report screen carries a branch selector in its top bar (visible only to owners with 2+ active stations under their account). Selecting a single branch shows that branch's data exactly as described throughout Part 2. Selecting **"All Branches"** does not create a new report type — it re-runs the identical report logic with data summed/merged across every branch the owner has access to, and adds one additional breakdown dimension at Level 2: **per-branch comparison**, alongside whatever breakdown that report already offers (per-category, per-staff, per-product).

### 11.2 Worked Example — True Profit in All-Branches Mode
An owner with three stations opens Report P1 in "All Branches" mode. Level 1 shows one combined True Profit figure for the month across all three stations. Level 2, instead of only showing the waterfall breakdown, now offers a toggle: "Waterfall Breakdown" (the same five-step subtraction as single-branch mode, but using combined totals) or "Per-Branch Comparison" (three side-by-side mini-waterfalls, one per station, so the owner can immediately see which station is dragging the combined number down). Level 3 remains identical — drilling into any branch's waterfall component takes the owner into that specific branch's underlying data, never blended.

### 11.3 Data Source for Consolidated Views
A lightweight Cloud Function `aggregateAcrossBranches` runs whenever any branch's `dailySnapshot`, `profitSnapshot`, or `zReports` document is written, and maintains a parallel `owners/{ownerId}/consolidatedSnapshots/{period}` document summing the relevant fields across every `stationId` under that owner's account. This keeps "All Branches" mode just as fast and just as real-time as single-branch mode — never a slow, on-the-fly cross-collection aggregation at report-open time.

### 11.4 Role Implication
"All Branches" mode is Owner-only by definition — a Manager or Cashier's role is always scoped to a single station, so the branch switcher and consolidated view never appear in their app at all, keeping their Reports menu exactly as simple as described throughout this document regardless of how large the owner's overall operation grows.

---

## PART 12 — ONBOARDING & FIRST-WEEK TRAINING PLAN FOR THE REPORTS MODULE

Building the module correctly is only half the requirement — Umar's own words, "matric pass salesman/manager samajh sakay," are a training requirement as much as a design requirement. This section specifies the minimum onboarding experience that must ship alongside the module.

### 12.1 First-Open Guided Walkthrough
The very first time any user (of any role) opens the Reports tab, a short, skippable, 4-screen overlay walkthrough appears (never longer — respecting that most users will skip past screen 2 if it's not immediately useful):
1. "Yeh A-Z list hai — har herf aik report hai." (This is the A-Z list — every letter is a report.) — highlights the search bar and the "My Frequent Reports" row.
2. "Har report mein pehle bade number nazar aayenge." (Every report shows big numbers first.) — highlights a sample KPI card grid with the color-meaning legend (green/amber/red) shown as a small persistent legend strip.
3. "Number par tap karein, tafseel milay gi." (Tap any number to get detail.) — demonstrates one Level 1 → Level 2 tap.
4. "Har report share ki ja sakti hai WhatsApp par." (Every report can be shared on WhatsApp.) — highlights the share icon.

### 12.2 In-Context Tooltips (First Use of Each Report Only)
The first time a user opens any specific report from the A-Z menu (tracked per-user, per-report, so it never repeats), a single small tooltip anchored to that report's most important KPI card explains, in one short sentence, what that specific number means in plain language — e.g., on first opening "P1 — True Profit," a tooltip reads: "Yeh woh paisa hai jo tamam kharch nikaal kar bacha" (This is the money left after all expenses are subtracted). This tooltip appears once per report per user, ever, then never again.

### 12.3 The "Ask a Report" Help Button
Every report's top bar carries a small "?" icon that, when tapped, shows a short, plain-language explanation card specific to that report (reusable content — the same explanation shown as the first-use tooltip in 12.2, but permanently accessible on demand rather than only appearing once) — so a user who forgets what a report means six weeks later has a permanent, always-available answer rather than relying on memory of a tooltip they saw once.

### 12.4 Manager-Led Training Checklist
A simple printable/shareable one-page checklist (itself generated as a small utility export from the module, not a separate feature) listing all 26 reports with a checkbox next to each, intended for a Manager to physically walk a new salesman through during their first week — reinforcing that this module is designed to be taught station-to-station by the people who already understand the business, not only through in-app tooltips alone.

---

## PART 13 — EDGE CASES AND FAILURE MODES (What Happens When Things Go Wrong)

A professional PRD does not only describe the happy path. The following edge cases must be explicitly handled, not left to whatever the framework does by default.

### 13.1 Connectivity Drops Mid-Report
If a user is viewing a live report (A, X, or any today-scoped report) and connectivity drops, the last-received data remains on screen with the mandatory "Last updated: {time}, showing cached data" banner described in Part 3.4 — the app never blanks the screen or shows a spinner indefinitely. When connectivity returns, the `onSnapshot` listener resumes automatically and the banner disappears the moment fresh data arrives, with no user action required.

### 13.2 A New Station With No History Yet
Every report handles the zero-data state explicitly and warmly, per Part 9.3's empty-state guidance — a brand-new station's Yearly Report (Y) does not show a broken chart with a single data point; it shows an honest message inviting the owner to check back once a few months of data exist, alongside whatever partial data is available for the current period.

### 13.3 A Correction After a Z-Report Has Already Been Generated
Per Report Z's design, a Z-Report is immutable once generated. If a genuine error is discovered later (e.g., a shift was mistakenly marked closed with wrong figures and needs correction), the correction is entered as a new Journal (J) entry dated on the day of correction — the original Z-Report for the original day stands unchanged, and the correction is fully visible and traceable in Report J and in the General Ledger (G), preserving both historical integrity and current accuracy simultaneously.

### 13.4 A Staff Member Removed From the System
If a staff member who appears throughout historical shift records (S1, S2, M, C2) is later deactivated or removed from Staff Master Data, their name and historical figures remain fully visible in every historical report exactly as they were recorded — deactivation affects only their ability to log in and start new shifts going forward, never the historical record. This is a strict requirement: financial and operational history must never appear to retroactively change or disappear because a person left the job.

### 13.5 Simultaneous Multi-Device Access
If the Owner and a Manager both have the Reports module open on separate phones at the same time, both see identical, simultaneously-updating live data via independent `onSnapshot` listeners on the same Firestore documents — there is no "locking" or "who has it open" conflict, since Reports are a read-only module for every role except the limited manual-entry actions explicitly noted in Part 5, which follow standard last-write-wins semantics consistent with the rest of the FuelPro platform.

### 13.6 A Report Requested for a Date Range Spanning a Product Rate Change
Any report that computes sales value from liters × rate (F, S, P1, and others) must correctly apply the **rate that was actually in effect at the time of each individual sale**, using the historical log from Report R1 — never a single "current rate" applied uniformly across a date range that actually contained a price change partway through. This is a correctness-critical edge case, since a naive implementation would silently misstate revenue for any period spanning a price change, which happens frequently in this industry.

### 13.7 Extremely Large Multi-Year Custom Date Ranges
If a user selects a custom range spanning several years, the app relies exclusively on the pre-aggregated `dailySnapshots`/`monthlySnapshots`/`yearlySnapshot` documents described in Part 8, never attempting a live re-scan of raw `shifts`/`ledgerEntries` across years of history — keeping even the most extreme query well within the sub-1.5-second load target from Part 6.

---

**یہ دستاویز مکمل ہے — Reports Module کا ایک ایک حرف، A سے Z تک، ریڈنگ سے کیش تک، اور ہر عملے کے فرد کی سمجھ تک، پوری طرح واضح کر دیا گیا ہے۔**

---

## PART 14 — BILINGUAL GLOSSARY OF TERMS USED IN THIS MODULE

For the development and design teams to keep translation consistent across all 26 reports, this glossary fixes the exact Urdu term paired with each recurring English term used throughout this document — no report should invent its own alternate translation for the same concept.

| English Term | Urdu Term | Used In |
|---|---|---|
| Variance | فرق (Farq) | C2, V, Z |
| Credit / Udhaar | ادھار (Udhaar) | C3, L1, U, R2 |
| Recovery | وصولی (Wasooli) | R2, S1 |
| Reading | ریڈنگ (Reading) | M, F, N |
| Reconciliation | ریکنسیلی ایشن / حساب برابر کرنا | C1, Section 4 |
| Outstanding | باقی رقم (Baqi Raqam) | O, L1, L2 |
| Aging | پرانا ہونا (Purana Hona) | O, L1 |
| True Profit | اصل منافع (Asal Munafa) | P1 |
| Expense | خرچہ (Kharcha) | E |
| Shift | شفٹ (Shift) | S2, X, Z |
| Cash Position | نقدی کی حالت | A, C1 |
| Tank | ٹینک (Tank) | I, T2 |

This table itself ships as a reference inside the app's Help section, so a new translator or a new hire updating the app later inherits the same consistent vocabulary this PRD establishes, rather than re-deriving translations report by report and drifting into inconsistency over time.

---

## PART 15 — ENGINE-CENTRIC ARCHITECTURE (The Platform Foundation)

### 15.1 Why Reports Must Become Configurations, Not Code

Parts 1–14 of this document describe **what** each report shows and **who** sees it. Parts 15–24 describe **how** the platform delivers all of it through a shared, reusable engine stack — so that when FuelPro grows from 30 reports (Fuel ERP) to 300+ reports (Fuel + Lube + CNG + Warehouse + Fleet + HR + CRM + Accounting), not a single engine needs to be rewritten.

The fundamental architectural shift: **a report is not a screen — it is a configuration file (a JSON manifest) that tells the engine stack what to fetch, how to calculate, how to visualize, who can see it, and what rules to evaluate.** The engine stack does all the work; the manifest simply describes the intent.

### 15.2 The Six-Layer Engine Stack

Every single report in Parts 2–14 is served through exactly six layers, executed in strict order:

```
┌─────────────────────────────────────────────┐
│  Layer 6: AI Engine                         │
│  (Summaries, Root Cause, Forecasts,         │
│   Anomaly Detection, Recommendations)       │
├─────────────────────────────────────────────┤
│  Layer 5: Permission Engine                 │
│  (Role check, field-level masking,          │
│   business-context filtering)               │
├─────────────────────────────────────────────┤
│  Layer 4: Visualization Engine              │
│  (KPI Cards, Charts, Tables, Gauges,        │
│   Waterfalls — all from Engine Type)        │
├─────────────────────────────────────────────┤
│  Layer 3: Drilldown Engine                  │
│  (Level 1→2→3 navigation, breadcrumbs,      │
│   cross-report linking, "View Source Shift") │
├─────────────────────────────────────────────┤
│  Layer 2: Aggregation Engine                │
│  (Formula execution, grouping, sorting,     │
│   period comparison, trend calculation)      │
├─────────────────────────────────────────────┤
│  Layer 1: Register Engine (Data Layer)      │
│  (Firestore queries, cache reads,           │
│   snapshot resolution, offline fallback)     │
└─────────────────────────────────────────────┘
```

**Data flows upward**: Layer 1 fetches raw data → Layer 2 applies formulas and aggregations → Layer 3 manages navigation depth → Layer 4 renders the visual → Layer 5 masks unauthorized fields → Layer 6 adds intelligence.

### 15.3 The Report Manifest (JSON Configuration)

Every report is defined by a single manifest file. Here is the canonical example for Report P1 (True Profit):

```json
{
  "reportId": "true_profit",
  "version": "1.0.0",
  "displayName": {
    "en": "True Profit Report",
    "ur": "اصل منافع رپورٹ"
  },
  "alphabetKey": "P1",
  "engineType": "Waterfall",
  "icon": "currency_rupee_circle",
  "colorAccent": "emerald",

  "dataSource": {
    "primary": "stations/{stationId}/profitSnapshot/{period}",
    "fallback": "compute_from_dependencies",
    "cacheStrategy": "snapshot_on_change",
    "cloudFunction": "recomputeProfitSnapshot"
  },

  "formulas": ["TRUE_PROFIT", "GROSS_SALES", "PURCHASE_COST", "TEST_LITER_LOSS", "CREDIT_AGING_COST", "OPERATING_EXPENSES"],

  "kpiCards": [
    {
      "id": "true_profit_value",
      "formula": "TRUE_PROFIT",
      "label": { "en": "True Profit", "ur": "اصل منافع" },
      "format": "currency_pkr",
      "colorLogic": "positive_green_negative_red",
      "trendComparison": "previous_period"
    }
  ],

  "waterfallSteps": [
    { "formula": "GROSS_SALES", "label": { "en": "Gross Sales", "ur": "کل فروخت" }, "type": "positive" },
    { "formula": "PURCHASE_COST", "label": { "en": "Purchase Cost", "ur": "خریداری" }, "type": "negative" },
    { "formula": "TEST_LITER_LOSS", "label": { "en": "Test Liter Loss", "ur": "ٹیسٹ لیٹر نقصان" }, "type": "negative" },
    { "formula": "CREDIT_AGING_COST", "label": { "en": "Credit Aging Cost", "ur": "ادھار عمر لاگت" }, "type": "negative" },
    { "formula": "OPERATING_EXPENSES", "label": { "en": "Operating Expenses", "ur": "آپریشنل اخراجات" }, "type": "negative" },
    { "formula": "TRUE_PROFIT", "label": { "en": "True Profit", "ur": "اصل منافع" }, "type": "result" }
  ],

  "drilldown": {
    "level2": {
      "type": "waterfall_component_tap",
      "destinations": {
        "PURCHASE_COST": "purchase_history",
        "TEST_LITER_LOSS": "test_liters",
        "OPERATING_EXPENSES": "expenses",
        "CREDIT_AGING_COST": "customer_aging"
      }
    },
    "level3": "inherit_from_destination"
  },

  "permissions": {
    "owner": { "view": true, "export": true },
    "manager": { "view": false },
    "cashier": { "view": false },
    "accountant": { "view": false }
  },

  "rules": ["PROFIT_NEGATIVE"],
  "aiEnabled": true,
  "offlineSupported": true,
  "exportFormats": ["pdf", "excel", "csv", "whatsapp"],

  "filters": {
    "dateRange": { "default": "this_month", "options": ["this_month", "last_month", "this_year", "custom"] },
    "branch": { "visible": "multi_branch_only" }
  },

  "dependencies": ["fuel_sales", "expenses", "purchase_history", "test_liters", "customer_aging"],

  "performance": {
    "level1LoadTarget": "500ms",
    "estimatedFirestoreReads": 15,
    "memoryBudget": "8MB"
  }
}
```

### 15.4 Benefits of the Manifest Approach

1. **Adding a new report = creating a new JSON file.** No new React components, no new Firestore queries, no new permission checks. The engine stack handles everything.
2. **Consistency is automatic.** Every report looks the same, navigates the same, exports the same, caches the same — because the engines enforce it, not individual developers.
3. **Testing is centralized.** Test the six engines once, thoroughly. Every report that passes manifest validation is automatically correct.
4. **300+ reports with the same team size.** When FuelPro expands to Lube, CNG, Warehouse, and beyond, new reports are authored by business analysts writing manifests, not by engineers writing code.
5. **A/B testing and customization become trivial.** Change a manifest, get a different report. No deployment needed for report-level changes if manifests are stored in Firestore.

---

## PART 16 — ENGINE TYPE CLASSIFICATION SYSTEM

### 16.1 The Engine Type Registry

Every report in Part 2 maps to exactly one Engine Type. The Engine Type determines which Visualization Engine renderer is used, which Level 2 breakdown pattern applies, and what interactive behaviors the user experiences. Adding a new Engine Type is a significant architectural decision requiring an Architecture Decision Record (ADR); adding a new report within an existing Engine Type is routine configuration.

| Engine Type ID | Visual Pattern | Level 2 Behavior | Level 3 Behavior | Reports Using It |
|---|---|---|---|---|
| `BusinessDashboard` | 2×3 KPI card grid, each card is a shortcut to another report | Tap card → navigate to source report | Inherited from destination report | A, K |
| `SalesRegister` | KPI cards (liters, value, margin) + bar chart by product/day | Tap card → per-product or per-day breakdown | Individual shift entries with source link | F, S |
| `Ledger` | Running balance header + chronological debit/credit list | Tap account/type chip → filtered transaction list | Individual entry detail with "View Source Shift" | B, D2, G, L1, L2 |
| `Comparison` | Side-by-side twin KPI cards with ↑↓ percentage between | Toggle Monthly/Yearly → 6-period bar chart | Same as source metric's own Level 3 | Q |
| `Trend` | Line chart (30-day default) + net summary card | Tap → day-of-week pattern breakdown | Individual shift variance entries | V |
| `Forecast` | Projected value card + confidence band chart + AI explanation | Tap → historical vs. projected overlay | Source data points used for projection | (Future) |
| `Timeline` | Chronological event list with type/source tags | Filter by event type → filtered list | Individual event detail + who/when/why | J, R1, W2 |
| `Approval` | Pending items list with approve/reject actions | Tap → item detail with full context | Audit trail of approval chain | (Future) |
| `Audit` | Nozzle/shift matrix with flag badges | Tap nozzle → chronological reading pairs | Full reading detail with photo, GPS, override reason | M |
| `Variance` | Staff-ranked variance table with color bands | Tap staff → their individual shift variances | Individual shift with variance amount + reason | C2 |
| `Gauge` | Circular gauge per tank/unit with fill %, color zones | Tap gauge → stock history area chart | Individual stock movement events (shifts, deliveries) | I, T2 |
| `Waterfall` | Step-by-step subtraction visualization | Tap any step → navigate to that component's own report | Inherited from destination report | P1 |
| `Aging` | Bucket breakdown (0-30/30-60/60-90/90+) with amount per bucket | Tap bucket → list of customers/suppliers in that bucket | Individual ledger for that customer/supplier | O |
| `Snapshot` | Single-page, flat, printable summary — no drill-down | No Level 2 — intentionally flat | No Level 3 — designed for print/share only | Z |

### 16.2 Engine Type Rules

1. **One report, one Engine Type.** A report never mixes two Engine Types. If a screen needs two types, it must be split into two reports.
2. **Engine Types are immutable once released.** Changing the visual pattern or navigation behavior is a breaking change — requiring a versioned migration.
3. **Sub-reports inherit their parent's Engine Type unless explicitly overridden** in the manifest.
4. **Maximum 20 Engine Types for the entire platform lifetime.** Configuration over proliferation.

### 16.3 Complete A-Z Engine Type Mapping

| Letter | Report Name | Engine Type |
|---|---|---|
| A | Today's Summary Dashboard | `BusinessDashboard` |
| B | Bank Cash Ledger | `Ledger` |
| C1 | Cash Book | `Ledger` |
| C2 | Cash Variance | `Variance` |
| C3 | Credit Given Today | `Ledger` (filtered) |
| D1 | Daily Report Summary | `BusinessDashboard` (date-selectable) |
| D2 | Digital Cash Ledger | `Ledger` |
| E | Expenses | `SalesRegister` (categories as products) |
| F | Fuel Sales | `SalesRegister` |
| G | General Ledger | `Ledger` |
| H | Purchase History | `SalesRegister` (supplier-oriented) |
| I | Inventory & Stock | `Gauge` |
| J | Manual Entries | `Timeline` |
| K | KPI Dashboard | `BusinessDashboard` (configurable) |
| L1 | Customer Ledger | `Ledger` |
| L2 | Supplier Ledger | `Ledger` |
| M | Meter Readings | `Audit` |
| N | Nozzle Performance | `SalesRegister` (nozzle-oriented) |
| O | Outstanding & Overdue | `Aging` |
| P1 | True Profit | `Waterfall` |
| P2 | Purchase Spend | `Comparison` |
| Q | Quick Comparison | `Comparison` |
| R1 | Rate Change History | `Timeline` |
| R2 | Recoveries | `SalesRegister` (recovery-oriented) |
| S | Sales Report | `SalesRegister` |
| S1 | Staff Report | `SalesRegister` (staff-oriented) |
| S2 | Shift Logs | `Timeline` |
| S3 | Supplier Payments | `SalesRegister` (payment-oriented) |
| S4 | Stock Report | Cross-link to `I` |
| T1 | Tax/OGRA | `SalesRegister` (tax-oriented) |
| T2 | Tank Report | `Gauge` |
| T3 | Test Liters | `SalesRegister` (test-oriented) |
| U | Udhaar Summary | `Aging` (simplified) |
| V | Variance Trend | `Trend` |
| W1 | Wages/Salary | `SalesRegister` (salary-oriented) |
| W2 | WhatsApp Share Log | `Timeline` |
| X | X-Report (Live Shift) | `BusinessDashboard` (live) |
| Y | Yearly Annual | `Comparison` (12-month) |
| Z | Z-Report | `Snapshot` |

---

## PART 17 — FORMULA REGISTRY (Single Source of Truth for Every Calculation)

### 17.1 Why a Formula Registry Is Non-Negotiable

Without a centralized Formula Registry, two separate developers building Report P1 (True Profit) and Report E (Expenses) will inevitably write slightly different expense-calculation logic — one might include supplier delivery charges, the other might not. Over time, the Owner sees two different "expense" numbers on two screens, destroying trust in the platform.

The Formula Registry is the **single, canonical, versioned definition** of every calculation. No report, no KPI, no chart, no AI summary may compute a value using inline logic — every computation must reference a registered formula by its `formulaId`.

### 17.2 The Complete Formula Registry

| Formula ID | Formula Definition | Input Sources | Dependencies | Used By | Ver |
|---|---|---|---|---|---|
| `GROSS_SALES` | `Σ(shiftReadings.computedLitersSold × productRates.rateAtTimeOfSale)` grouped by product | `shiftReadings`, `productRates` | — (base) | F, S, P1, Q, Y, Z | 1.0 |
| `PURCHASE_COST` | `Σ(supplierInvoices.totalAmount)` inclusive of delivery charges when bundled | `supplierInvoices` | — (base) | H, P1, P2, Q, Y | 1.0 |
| `OPERATING_EXPENSES` | `Σ(ledgerEntries.debit)` where `ledgerType == "expense"` grouped by category | `ledgerEntries[expense]` | — (base) | E, P1, Q, Y, Z | 1.0 |
| `TEST_LITER_LOSS` | `Σ(shiftTestLiters.liters × productRates.rateAtTimeOfTest)` | `shiftTestLiters`, `productRates` | — (base) | T3, P1 | 1.0 |
| `CREDIT_AGING_COST` | `Σ(customers.currentBalance × agingFactor(days))` — 0%(0-30d), 2%(30-60d), 5%(60-90d), 10%(90+d) | `customers`, `ledgerEntries[customer]`, `agingSnapshot` | `CUSTOMER_AGING_BUCKETS` | O, P1 | 1.0 |
| `TRUE_PROFIT` | `GROSS_SALES - PURCHASE_COST - TEST_LITER_LOSS - CREDIT_AGING_COST - OPERATING_EXPENSES` | (computed) | All 5 above | P1, Q, Y | 1.0 |
| `CASH_VARIANCE` | `expectedCash - actualCashCounted` per shift | `shifts` | — (base) | C2, V, Z | 1.0 |
| `NET_CASH_POSITION` | `Σ(cash.balance) + Σ(bank.balance) + Σ(digital.balance)` | `ledgerEntries[cash,bank,digital]` | — (base) | A, C1, D2, Q | 1.0 |
| `TANK_STOCK` | `opening + Σ(deliveries) - Σ(sales) - Σ(testLiters) - Σ(losses)` per tank | `tanks`, `supplierInvoices`, `shiftReadings`, `shiftTestLiters`, `tankLosses` | — (base) | I, T2 | 1.0 |
| `CUSTOMER_AGING_BUCKETS` | FIFO assignment into 0-30/30-60/60-90/90+ day buckets | `customers`, `ledgerEntries[customer]` | — (base) | O, L1, U | 1.0 |
| `TOTAL_OUTSTANDING_CUSTOMERS` | `Σ(customers.currentBalance)` where `> 0` | `customers` | — (base) | L1, U, O, A | 1.0 |
| `TOTAL_OUTSTANDING_SUPPLIERS` | `Σ(suppliers.currentBalance)` where `> 0` | `suppliers` | — (base) | L2, O | 1.0 |
| `STAFF_RELIABILITY_SCORE` | `(zeroVarianceShifts / totalShifts) × 100` per staff per period | `shifts` | `CASH_VARIANCE` | S1 | 1.0 |
| `RECOVERY_RATE` | `Σ(recoveries) / Σ(creditGiven) × 100` | `ledgerEntries[customer]` | — (base) | R2, U | 1.0 |
| `PROFIT_MARGIN_PERCENT` | `(TRUE_PROFIT / GROSS_SALES) × 100` | (computed) | `TRUE_PROFIT`, `GROSS_SALES` | S, P1, Q | 1.0 |
| `DAILY_AVERAGE_SALES` | `GROSS_SALES / operatingDays` | `dailySnapshots` | `GROSS_SALES` | Q, Y | 1.0 |
| `SALARY_ADJUSTED` | `basePay × (actualDays / expectedDays)` per staff | `staff`, `staffAttendance` | — (base) | W1, S1 | 1.0 |
| `TAX_COMPONENT` | `Σ(liters × taxRate)` per tax type per product | `shiftReadings`, `taxRates` | `GROSS_SALES` | T1 | 1.0 |
| `NOZZLE_PERFORMANCE_INDEX` | `(nozzleLiters / stationAvgPerNozzle) × 100` | `shiftReadings` | `GROSS_SALES` | N | 1.0 |

### 17.3 Formula Registry Rules

1. **Unique `formulaId` + version.** Changing a formula increments version and triggers snapshot recalculation.
2. **No inline calculations.** Every value calls `formulaEngine.compute(formulaId, context)`.
3. **Acyclic dependencies.** Validated at build time.
4. **Formula audit trail.** Every evaluation logged: `formulaId`, `version`, `inputs`, `result`, `timestamp`, `computedBy`.
5. **Formula testing.** Unit tests with known inputs/outputs on every CI/CD build — failure = build-breaker.

---

## PART 18 — BUSINESS RULE ENGINE (Declarative Alert & Threshold System)

### 18.1 Purpose

The Rule Engine is a declarative, centralized, configurable system where every business threshold is registered once, evaluated automatically, and enforced consistently.

### 18.2 The Complete Rule Registry

| Rule ID | Condition | Severity | Visual Action | Notification | Reports | Config |
|---|---|---|---|---|---|---|
| `VARIANCE_MINOR` | `abs(variance) > 200 AND <= 500` | ℹ️ Info | Amber badge | Log only | C2, V, S2 | Owner |
| `VARIANCE_WARNING` | `abs(variance) > 500 AND <= 2000` | ⚠️ Warning | Amber + "Needs Review" | In-app → Manager | C2, V, Z | Owner |
| `VARIANCE_CRITICAL` | `abs(variance) > 2000` | 🔴 Critical | Red + auto-flag | Push → Owner+Manager | C2, V, Z, A | Owner |
| `STOCK_HEALTHY` | `stock >= reorderLevel × 1.5` | ✅ Healthy | Green gauge | None | I, T2 | Owner |
| `STOCK_REORDER` | `stock < reorderLevel AND >= critical` | ⚠️ Warning | Amber gauge + "Order Soon" | In-app → Manager | I, T2, A | Owner |
| `STOCK_CRITICAL` | `stock < criticalLevel` | 🔴 Critical | Red gauge + "Order Now" | Push+SMS → Owner | I, T2, A | Owner |
| `TANK_OVERFLOW_WARN` | `stock > capacity × 0.90` | ⚠️ Warning | Amber overflow | In-app | I, T2 | System |
| `TANK_OVERFLOW_CRIT` | `stock > capacity × 0.95` | 🔴 Critical | Red pulsing | Push → Owner+Manager | I, T2 | System |
| `CREDIT_WATCH` | `balance > 0 AND oldest > 30d` | ⚠️ Warning | Amber row | Visual only | L1, O | Owner |
| `CREDIT_OVERDUE` | `balance > 0 AND oldest > 60d` | 🔴 Critical | Red + WhatsApp prompt | In-app → Owner | L1, O, U | Owner |
| `CREDIT_SEVERE` | `balance > 50k AND oldest > 90d` | 🔴🔴 Severe | Red + "Block Credit" | Push → Owner | L1, O | Owner |
| `EXPENSE_APPROACHING` | `expense >= budget × 0.80` | ℹ️ Info | Amber progress | None | E | Owner |
| `EXPENSE_WARNING` | `expense >= budget × 0.95` | ⚠️ Warning | Deep amber + "Almost Over" | In-app | E | Owner |
| `EXPENSE_EXCEEDED` | `expense >= budget` | 🔴 Critical | Red + "Over Budget" | Push → Owner | E, A | Owner |
| `RATE_CHANGE_ANOMALY` | `abs(change) > 5%` | ⚠️ Warning | Flag icon | Audit log | R1 | System |
| `PROFIT_LOW` | `profit > 0 AND margin < 5%` | ⚠️ Warning | Amber KPI | In-app | P1 | Owner |
| `PROFIT_NEGATIVE` | `profit < 0` | 🔴 Critical | Red KPI + AI root cause | Push + AI | P1, A | System |
| `SHIFT_DURATION_LONG` | `duration > 14h` | ⚠️ Warning | Wellbeing badge | In-app → Manager | S2, X, S1 | Owner |
| `SHIFT_DURATION_EXTREME` | `duration > 18h` | 🔴 Critical | Red wellbeing | Push → Owner+Manager | S2, X, S1 | System |
| `RECOVERY_STALE` | `balance > 10k AND no recovery > 30d` | ⚠️ Warning | "Follow Up" badge | Weekly digest | R2, L1 | Owner |
| `NOZZLE_UNDERPERFORM` | `liters < avg × 0.50` | ⚠️ Warning | Amber + "Check Calibration" | In-app → Manager | N | System |
| `NOZZLE_INACTIVE` | `liters == 0 AND shifts > 0` | 🔴 Critical | Red "Possibly Broken" | Push → Manager | N | System |
| `SUPPLIER_DUE` | `dueDate <= today + 3d` | ⚠️ Warning | Amber "Due Soon" | In-app → Owner | L2, S3 | System |
| `SUPPLIER_OVERDUE` | `dueDate < today` | 🔴 Critical | Red "Overdue" | Push → Owner | L2, S3, O | System |

### 18.3 Rule Engine Architecture

```
Rule Registry (Firestore: stations/{stationId}/ruleConfig)
     ▼
Rule Evaluator (Cloud Function on data change)
     ├── Visual → Badge updates
     ├── Notification → FCM / in-app
     └── Audit → ruleEvaluationLog
```

### 18.4 Rule Engine Rules

1. **Server-side evaluation** (Cloud Functions) — fires even with no report open.
2. **Every evaluation logged** — `ruleId`, `evaluatedAt`, `result`, `severity`, `entityId`, `notifications`.
3. **Configurable thresholds in Firestore** — editable by Owner in Settings.
4. **Rule suppression** with mandatory expiry — auto-resumes.
5. **Highest-severity-only notifications** — no cascading floods.

---

## PART 19 — REPORT DEPENDENCY GRAPH

### 19.1 Purpose

Hidden dependencies are the most dangerous source of bugs at scale. The Dependency Graph makes every inter-report relationship explicit, enforceable, and automatically managed.

### 19.2 The Complete Dependency DAG

```
                    ┌────────────────────────┐
                    │   Y: Yearly Annual     │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │ D1: Daily Snapshots     │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │   Z: Z-Report          │
                    └──┬───┬───┬───┬─────────┘
                       │   │   │   │
          ┌────────────┘   │   │   └──────────┐
          ▼                ▼   ▼               ▼
   ┌──────────┐    ┌───────────────┐    ┌──────────┐
   │ S: Sales │    │ C1: Cash Pos  │    │ E: Exps  │
   │ F: Fuel  │    │ B: Bank       │    └────┬─────┘
   └────┬─────┘    │ D2: Digital   │         │
        │          └───────┬───────┘         ▼
        ▼                  ▼           Ledger(expense)
   ShiftReadings    Ledger(cash/bank/digital)
        │
        ▼
   ProductRates(R1)

   P1: TRUE PROFIT
    = GROSS_SALES - PURCHASE_COST
    - TEST_LITER_LOSS - CREDIT_AGING_COST
    - OPERATING_EXPENSES
    │    │       │         │        │
    ▼    ▼       ▼         ▼        ▼
   F/S   H      T3         O        E

   I: TANK STOCK
    = Opening + Imports - Sales - TestLiters - Losses
    │      │         │        │
    ▼      ▼         ▼        ▼
  Tanks  SupplierInv ShiftRdgs ShiftTestLtrs
```

### 19.3 Dependency Graph Enforcement

1. **Build-time validation:** No cycles, all dependencies resolve, all formulas exist, no orphans.
2. **Cache invalidation cascading:** New shift → affected formulas → affected reports → walk graph upward.
3. **Impact analysis:** Before formula changes, system reports affected reports and snapshot recalculations needed.

---

## PART 20 — ENTERPRISE REPORT METADATA REGISTRY

### 20.1 Purpose

Every report carries machine-readable metadata for DevOps and platform self-management. **Never shown in UI** (Rule #126) — Developer Console only.

### 20.2 The Metadata Schema

| Field | Type | Example (P1) |
|---|---|---|
| `reportId` | `string` | `true_profit` |
| `version` | `semver` | `1.0.0` |
| `engineType` | `EngineTypeId` | `Waterfall` |
| `owner` | `string` | `finance` |
| `formulas` | `FormulaId[]` | `[TRUE_PROFIT, ...]` |
| `dependencies` | `ReportId[]` | `[fuel_sales, expenses, ...]` |
| `isRealtime` | `boolean` | `false` |
| `cacheStrategy` | `enum` | `snapshot_on_change` |
| `cacheTTL` | `seconds / null` | `null` |
| `refreshTrigger` | `string / null` | `recomputeProfitSnapshot` |
| `permissions` | `RolePermissionMap` | `{owner: {view, export}}` |
| `rules` | `RuleId[]` | `[PROFIT_NEGATIVE, PROFIT_LOW]` |
| `aiEnabled` | `boolean` | `true` |
| `aiCapabilities` | `AICapability[]` | `[summary, root_cause, explain_number]` |
| `offlineSupported` | `boolean` | `true` |
| `estimatedReadCost` | `number` | `15` |
| `estimatedComputeCost` | `string` | `light` |
| `performanceBudget` | `object` | `{level1: "500ms", level2: "1s"}` |
| `memoryBudget` | `string` | `8MB` |
| `exportFormats` | `Format[]` | `[pdf, excel, csv, whatsapp]` |
| `i18nKeys` | `string[]` | `[report.p1.title, ...]` |
| `drilldownDepth` | `number` | `3` |
| `alphabetKey` | `string` | `P1` |
| `createdDate` | `ISO8601` | `2026-08-01` |
| `lastModified` | `ISO8601` | `2026-08-03` |
| `status` | `enum` | `active` |
| `tags` | `string[]` | `[financial, profit, executive]` |

### 20.3 Rules

1. **Every report MUST have complete metadata.** No metadata = CI/CD failure.
2. **`reportId` is immutable.** Renaming changes `displayName` only.
3. **`estimatedReadCost` measured, not guessed.** Updated quarterly.
4. **Developer Console features:** Health Dashboard, Dependency Visualizer, Formula Inspector, Performance Monitor, Cost Estimator.

---

## PART 21 — PERFORMANCE BUDGET

### 21.1 Why It's a PRD Requirement

Imran doesn't say "the report feels slow" — he just stops using it. Performance = product feature. Every target = acceptance criterion.

### 21.2 Operation Targets

| Operation | Target | Enforcement |
|---|---|---|
| **KPI Cards (L1)** | **< 500ms** | Pre-aggregated snapshots |
| **Chart/Breakdown (L2)** | **< 1 sec** | Canvas charts, prefetch |
| **Line-Item Detail (L3)** | **< 800ms** | Cursor pagination, virtual scroll |
| **Drilldown Navigation** | **< 800ms** | Background prefetch |
| **Search/Filter** | **< 300ms** | Client-side index |
| **Export (PDF)** | **< 5 sec** | Worker thread |
| **Export (Excel/CSV)** | **< 3 sec** | Streaming write |
| **AI Summary** | **< 3 sec** | Pre-computed + edge inference |
| **Report Menu** | **< 1 sec** | Static menu, lazy bodies |
| **Branch Switch** | **< 1.5 sec** | Pre-aggregated snapshots |

### 21.3 Resource Budgets

| Resource | Budget | Enforcement |
|---|---|---|
| Firestore Reads | < 50 per report | Denormalized schemas |
| Memory (Heap) | < 30MB per report | Virtual scrolling |
| CPU (Main Thread) | < 100ms blocking | Web Workers |
| Bundle Size | < 50KB per Engine Type | Code splitting |
| Firestore Listeners | < 5 per report | Shared subscriptions |

### 21.4 Network Targets

| Network | L1 Target | Fallback |
|---|---|---|
| 4G / WiFi | < 500ms | Full live |
| 3G (Pakistan) | < 1.5 sec | Snapshot + live update |
| 2G | < 3 sec | Offline cache + banner |
| Offline | < 500ms | IndexedDB + indicator |

### 21.5 Enforcement

1. **Automated tests on every PR** — fails if target exceeded > 20%.
2. **Performance dashboard** — p50/p90/p99 per report.
3. **Regression alerts** — 24h above budget = engineering alert.
4. **Quarterly review** — mandatory optimization for over-budget reports.

---

## PART 22 — CACHING STRATEGY (Four-Level Cache Hierarchy)

### 22.1 Cache Levels

```
L1: In-Memory (Zustand) — <1ms, volatile, 60s/session TTL
L2: IndexedDB (Firestore Offline) — <10ms, survives restart
L3: Firestore Server (Snapshots) — 50-500ms, persistent
L4: Cloud Function Recompute — 1-10s, only on data change
```

### 22.2 Strategy by Freshness

| Data | Strategy | TTL | Stale Tolerance |
|---|---|---|---|
| **Live** (X, A, I live) | `realtime` onSnapshot | 0 | 0 sec |
| **Today (Closed)** | `short_cache` L1 60s | 60s | 60 sec |
| **Yesterday** | `daily_snapshot` L2+L3 | ∞ | 0 |
| **This Month** | `snapshot_on_change` L1+L3 | Event-driven | < 5 sec |
| **Past Month** | `immutable` L2+L3 | ∞ | 0 |
| **Past Year** | `immutable` L3 | ∞ | 0 |
| **Current Year** | `computed` L1+L3 | On monthly update | < 5 sec |
| **Z-Report** | `immutable_document` L3 | ∞ (security rule) | 0 |
| **Aging** | `nightly_snapshot` L2+L3 | 24h | ≤ 24h |
| **AI Summaries** | `ai_cache` L1+L3 | On source change | 0 |
| **Menu** | `session_cache` L1+L2 | Session | Full session |

### 22.3 Cache Invalidation Cascade

```
New Shift Submitted
  ├─→ Invalidate L1: A, C2, C3, F, S, S2, V, X
  ├─→ Cloud Function: liveDashboard, profitSnapshot, tankStock
  └─→ Dependency walk: P1→Q, F→S
```

### 22.4 Cache Rules

1. **Read path NEVER triggers Cloud Function.**
2. **Hit/miss instrumented** in performance dashboard.
3. **Offline = L2 only** + "Last updated" banner.
4. **Cache warming** — 3 most-used reports pre-warmed on launch.
5. **Stale indicator** — clock icon on financial KPIs > 60s old.

---

## PART 23 — AI INTELLIGENCE LAYER (Enterprise Intelligence Engine)

### 23.1 Vision

Transform reports from "numbers on screen" to "explained, actionable intelligence." Governed by AI Rules #123–125: **analyze, summarize, explain, forecast, recommend — never invent or override.**

### 23.2 The Seven AI Capabilities

#### Capability 1: AI Summary (خلاصہ)

2–3 sentence plain-language summary of any report. Collapsible card at Level 1, collapsed by default.

**Example (P1, Aug 2026):**
> "اس مہینے اصل منافع 53 لاکھ 45 ہزار ہے — پچھلے مہینے سے 8.2% کم۔ بڑی وجہ ڈیزل خریداری قیمت میں 4.5 روپے/لیٹر اضافہ۔"

#### Capability 2: Root Cause Analysis (وجہ تلاش)

When a rule triggers, AI explains WHY by walking the Formula dependency chain.

**Example (PROFIT_NEGATIVE):**
> "منافع منفی ہوا: 1) ڈیزل خریداری 18% زیادہ 2) پٹرول فروخت 15% کم — نوزل #3 بند 3) Rs.1.2L جنریٹر مرمت"

#### Capability 3: Explain This Number (نمبر سمجھائیں)

Long-press any KPI → calculation breakdown in plain language.

#### Capability 4: Forecast (پیشگوئی)

Weighted moving averages on historical snapshots. Confidence band + data range shown.

**Example (Tank Stock):**
> "ٹینک 2 میں 2.3 دن کا سٹاک — 5 اگست تک آرڈر دیں"

#### Capability 5: Recommendations (سفارشات)

Deterministic pattern-matching, not generative AI.

**Examples:**
> "Attock سے ڈیزل Rs.2.1/L سستا" · "جمعہ کو 2 سیلزمین رکھیں" · "عمران سب سے قابل اعتماد"

#### Capability 6: Anomaly Detection (غیر معمولی)

Rolling 30-day ±2σ deviation flagging with sparkle icon (✦). Dismissible with reason.

#### Capability 7: Smart Alerts (ذہین اطلاعات)

| Alert | Trigger | Channel | Cap |
|---|---|---|---|
| Stock | `STOCK_REORDER/CRITICAL` | Push+In-app | 1/tank/6h |
| Variance | `VARIANCE_CRITICAL` | Push+In-app | Per shift |
| Profit | `PROFIT_NEGATIVE` | Push+In-app | 1/day |
| Anomaly | ≥2σ deviation | In-app only | 3/day |
| Forecast | Stock-out prediction | Push+In-app | 1/day/metric |
| Daily Digest | Z-Report | WhatsApp (opt-in) | Daily |
| Weekly | W-o-W highlights | WhatsApp (opt-in) | Sunday |

### 23.3 AI Governance (Mandatory)

1. **Never invents numbers** — traces to Formula Registry + Firestore data.
2. **Never auto-executes** — recommendations only, human confirmation required.
3. **Outputs audited** — logged to `aiAuditLog` with full traceability.
4. **Prompts versioned** — reproducible outputs.
5. **Optional per station** — disableable without affecting reports.
6. **Language-consistent** — never mixes Urdu/English in one output.
7. **Cost transparent** — Developer Console shows per-station AI costs.

---

## PART 24 — PLATFORM IDENTITY & 10-YEAR SCALABILITY VISION

### 24.1 The Five Purposes

| Purpose | Description | Key Parts |
|---|---|---|
| **Decision Platform** | Informed decisions in < 3 seconds | 1–2, 23 |
| **BI Layer** | Aggregation, comparison, trends | 15–17 |
| **Command Center** | Real-time monitoring | 2, 22 |
| **Audit System** | Immutable, traceable records | 17–19 |
| **AI Engine** | Insights, anomalies, forecasts | 23 |

### 24.2 10-Year Roadmap

| Phase | Years | Reports | Engine Types | What's New |
|---|---|---|---|---|
| Fuel ERP | 1–2 | 30 | 14 | Current platform |
| +Lube +CNG | 2–3 | 60 | 14 | New manifests, same engines |
| Multi-Company | 3–5 | 150 | 16 | +Consolidation, +Intercompany |
| +Warehouse +Fleet +HR | 5–7 | 250 | 18 | +Scheduling, +GeoMap |
| +Manufacturing +Distribution | 7–10 | 400+ | 20 | +ProcessFlow, +SupplyChain |

### 24.3 Extension Points

| Extension | How | Review |
|---|---|---|
| New Report | JSON manifest | Peer (< 1 day) |
| New Engine Type | New renderer | ADR + full review |
| New Formula | Register + tests | Formula review |
| New Rule | Register + severity | Business review |
| New AI Capability | Module + prompt | AI governance |
| New Data Source | Register Engine map | Schema review |
| New Export Format | Format handler | Format review |
| New Theme | Design tokens | Design review |
| New Language | i18n translations | Translation review |
| New Business Module | Manifests + sources | Full architecture |

### 24.4 Why This Guarantees 10-Year Survival

1. **Reports never become legacy** — manifests, not code. Framework migration = rewrite 6 engines, not 400 screens.
2. **Formulas never drift** — one versioned registry, same metric = same number, always.
3. **Rules never hide** — centralized, Owner-configurable, no magic numbers.
4. **Performance never degrades** — explicit budgets + caching by freshness category.
5. **AI never hallucinates** — traceable prompts + verified data = deterministic and reproducible.

---

**اختتامیہ v2.0: یہ Enterprise Intelligence Platform صرف نمبر دکھانے کے لیے نہیں بنایا — یہ اُس اعتماد کے لیے بنایا ہے جو ایک مالک کو اپنے اسٹیشن پر، اور ایک سیلز مین کو اپنے کام پر، ہر روز دوبارہ حاصل ہونا چاہیے۔ اور اب یہ اعتماد 6 Engines، 19 Formulas، 25 Rules، ایک Dependency Graph، ایک 4-Level Cache، اور 7 AI Capabilities کی بنیاد پر کھڑا ہے — 10 سال تک بغیر دوبارہ لکھے۔**

---

## PART 25 — BUSINESS-FIRST PROGRESSIVE DISCLOSURE & GOLDEN LAYOUT MANDATE

### 25.1 The Core UX Law: Business First, Engine Behind

The reviewer's feedback identifies the most critical UX danger in enterprise ERP development: **building a Developer Diagnostics Panel instead of a Fuel Station Control Room.**

A matric-pass salesman or station manager opening FuelPro at 8:00 AM does **not** think in software engineering concepts (`SHA-256`, `Query Time`, `Formula ID`, `Metrics Executed`, `Data Quality`, `JSON Manifest`). They think in plain operational questions:

```
✅ Aaj kishna petrol bacha? (How much petrol is left today?)
✅ Diesel kishna bacha? (How much diesel is left?)
✅ Aaj kitne liters sold hue? (How many liters sold today?)
✅ Aaj kitne rupees ki sale hui? (What is today's sales value?)
✅ Aaj kitna cash aya? (How much cash came in today?)
✅ Bank mein kitna gaya? (How much was deposited in bank?)
✅ Customer ka kitna baqaya hai? (What is outstanding from customers?)
✅ Supplier ko kitna dena hai? (What is owed to suppliers?)
✅ Kaunsi shift mein masla hua? (Which shift had a variance/issue?)
```

If a report screen displays developer metadata by default, it has failed the primary user test. **Developer metadata is diagnostic tooling — not operational UI.**

---

### 25.2 Rule #126: Developer Diagnostics Isolation

1. **Default View = 100% Operational & Business-First.** Every report screen initially renders only human-readable business information: large numbers, clear Urdu/English labels, visual color status, interactive registers, and direct action buttons.
2. **Developer & Audit Mode Isolation.** Developer metadata (`Formula ID`, `Engine Type`, `SHA-256 Hash`, `Query Plan Execution Time`, `Metrics Executed`, `Raw Firestore JSON`) is strictly hidden from standard UI views. It is accessible **only** when an authorized Admin/Auditor activates **Developer Mode** (via explicit settings toggle or secure keyboard shortcut `Ctrl+Shift+D`).
3. **No Code Jargon on Public Screens.** Terms like `queryTime: 42ms`, `formula: TRUE_PROFIT_v1.0`, or `snapshot_id_89f` must never appear on any user-facing card, table, or receipt.

---

### 25.3 The Universal FuelPro Golden Layout Mandate

Every report screen in FuelPro across all 300+ current and future modules **MUST** strictly follow the standardized Golden Layout structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. ENTERPRISE TITLE HEADER                                             │
│    Report Name (Urdu + English) | Branch Switcher | Sync Badge        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. QUICK DATE SELECTOR CHIPS                                           │
│    [ Today ] [ Yesterday ] [ This Week ] [ This Month ] [ Custom ]     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. LIVE KPI CARDS GRID (Interactive — Tap any card to drill down)     │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│    │ Big Number   │  │ Big Number   │  │ Big Number   │                 │
│    │ Simple Label │  │ Simple Label │  │ Simple Label │                 │
│    │ Color Status │  │ Color Status │  │ Color Status │                 │
│    └──────────────┘  └──────────────┘  └──────────────┘                 │
├────────────────────────────────────────────────────────────────────────┤
│ 4. VISUAL CHARTS & GAUGES SECTION                                      │
│    (Stock Level Gauges, Trend Lines, Waterfall Comparison)              │
├────────────────────────────────────────────────────────────────────────┤
│ 5. ADVANCED SEARCH & FILTER BAR                                        │
│    🔍 Live Search... | Status Filter | Category Filter | Sort          │
├────────────────────────────────────────────────────────────────────────┤
│ 6. MAIN REGISTER (Data Table / Detailed List)                          │
│    Date/Time | Description | Reference | Amount | Status | Actions     │
├────────────────────────────────────────────────────────────────────────┤
│ 7. PAGINATION & SUMMARY ROW                                            │
│    Showing 1-50 of 420 entries | Total Liters: 12,450L | Total: ₨4.2M   │
├────────────────────────────────────────────────────────────────────────┤
│ 8. EXPORT & ACTION FOOTER                                              │
│    [ 📄 PDF ]   [ 📊 Excel ]   [ 🖨️ Print ]   [ 💬 WhatsApp Share ]     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 25.4 The 4-Level Enterprise Drilldown Hierarchy

To prevent mental fatigue and build consistent muscle memory, every metric in FuelPro navigates through the exact same 4-level progressive disclosure path:

```
Level 1: Dashboard / Live KPI Cards
   │ (Tap any KPI card — e.g. "Petrol Stock: 2,480 L" or "Customer Balance: ₨480,000")
   ▼
Level 2: Register View
   │ (Filtered Data Table — Search, Date Filters, Customer List, Tank Movement)
   ▼
Level 3: Transaction / Document View
   │ (Specific Shift Log, Nozzle Reading Pair, Customer Invoice, Expense Receipt)
   ▼
Level 4: Audit / Source Record View (Developer & Auditor Mode Only)
   │ (Immutable Firebase Document, Audit Trail, Ledger Posting Details, SHA-256)
```

---

### 25.5 Worked UI Example 1: Petrol Stock Report

#### Level 1 View (Stock Dashboard):
```text
🛢 PETROL STOCK REPORT
Quick Filters: [ Today ] [ Yesterday ] [ This Week ] [ This Month ]

┌────────────────────────────────────────────────────────┐
│ PETROL TANK #1                                         │
│ Current Stock:  2,480 Liters                           │
│ Tank Capacity:  5,000 Liters                           │
│ Stock Level:    ███████████░░░ (49%)                   │
│ Status:         ⚠️ Low Stock — Reorder within 2 Days   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ DIESEL TANK #2                                         │
│ Current Stock:  4,820 Liters                           │
│ Tank Capacity:  8,000 Liters                           │
│ Stock Level:    ██████████████████ (60%)               │
│ Status:         ✅ Stock Healthy                        │
└────────────────────────────────────────────────────────┘

TODAY'S MOVEMENT SUMMARY:
Opening: 3,120 L  | Purchased: 5,000 L | Sold: 5,640 L | Test: 20 L | Current: 2,480 L
```

*Tapping on "2,480 Liters"* → Navigates to **Level 2: Petrol Stock Register**

#### Level 2 View (Petrol Stock Register):
```text
PETROL STOCK MOVEMENT REGISTER
Filters: [ Date: Today ] [ Tank: Tank #1 ] [ Shift: All ]
🔍 Search transactions...

Date & Time      | Event / Source     | Volume In | Volume Out | Running Stock
-----------------|--------------------|-----------|------------|--------------
07 Aug 06:00 AM  | Opening Stock      | —         | —          | 3,120 L
07 Aug 08:30 AM  | PSO Delivery #482  | +5,000 L  | —          | 8,120 L
07 Aug 02:00 PM  | Shift 1 Sales      | —         | -2,820 L   | 5,300 L
07 Aug 02:10 PM  | Calibration Test   | —         | -20 L      | 5,280 L
07 Aug 08:00 PM  | Shift 2 Sales      | —         | -2,800 L   | 2,480 L
```

*Tapping on "Shift 1 Sales row"* → Navigates to **Level 3: Shift #1 Transaction Detail**  
*Switching to Developer Mode* → Displays **Level 4: Raw Firestore `shiftReadings` Document & SHA-256 Audit Log**

---

### 25.6 Worked UI Example 2: Customer Outstanding Report

#### Level 1 View (Credit Summary):
```text
💳 CUSTOMER OUTSTANDING SUMMARY
Quick Filters: [ Today ] [ Yesterday ] [ This Month ] [ Custom ]

[ Total Outstanding: ₨ 480,000 ]   [ Overdue > 60 Days: ₨ 120,000 ]   [ Active Debtors: 14 ]
```

*Tapping "₨ 480,000"* → Navigates to **Level 2: Customer Outstanding Register**

#### Level 2 View (Customer Register):
```text
CUSTOMER OUTSTANDING REGISTER
🔍 Search customer name or phone...

Customer Name  | Total Balance | Aging Status   | Last Payment Date | Action
---------------|---------------|----------------|-------------------|------------------
Ali Oil Store  | ₨ 20,000      | 🔴 65 Days     | 02 June 2026      | [ WhatsApp ] [ Ledger ]
Tariq Goods    | ₨ 85,000      | ⚠️ 40 Days     | 20 July 2026      | [ WhatsApp ] [ Ledger ]
Khan Transport | ₨ 150,000     | 🔴 75 Days     | 15 May 2026       | [ WhatsApp ] [ Ledger ]
```

*Tapping "Ali Oil Store"* → Navigates to **Level 3: Ali Oil Detailed Customer Ledger** (Invoices, Recoveries, Shift Credit slips)

---

### 25.7 Mandatory Implementation Check for AI Developers

Before considering any report or module complete, AI developers **MUST** verify:

1. **Can a matric-pass manager understand the top 3 cards in under 5 seconds?** If not, simplify titles and layout.
2. **Is every single KPI card clickable?** Tapping any card must open its corresponding Register view.
3. **Are developer diagnostics hidden?** No `SHA-256`, `Query Time`, `Formula ID`, or JSON string must appear in default UI mode.
4. **Is the Golden Layout enforced?** Every screen must contain: Title → Quick Date Filter → KPI Cards → Charts/Gauges → Search & Filters → Register Table → Pagination → Export Actions.

---

**ختمی ہدایت: FuelPro کا مقصد سافٹ ویئر انجینئرنگ کا مظاہرہ کرنا نہیں، بلکہ پٹرول پمپ مالک اور مینیجر کو 5 سیکنڈ میں کاروبار کی سچی تصویر دکھانا ہے۔ بزنس پہلے، انجینئرنگ پیچھے۔**

---

## PART 26 — ENTERPRISE WORKSPACE & ADAPTIVE UX ENGINE (THE 10/10 PLATFORM ARCHITECTURE)

### 26.1 From Report-Centric to Workspace-Centric Architecture

Parts 1–25 established FuelPro as an Engine-Centric, Business-First Intelligence Platform. However, true Tier-1 Enterprise ERP systems (SAP S/4HANA, Oracle NetSuite, Microsoft Dynamics 365) are not merely collection of reports — they are **Workspace-Centric Platforms**.

Users do not log in looking for "Report #14" or "Report #22". They log in to fulfill their specific **Role**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE-BASED WORKSPACE                            │
│  (Salesman Workspace  |  Manager Workspace  |  Owner Workspace)        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. ACTIVE TASKS      → Immediate operational actions needed now        │
│ 2. AI INSIGHTS       → Smart alerts, forecasts, and root causes        │
│ 3. PINNED WIDGETS    → Personalized KPIs, Gauges, and Visual Charts    │
│ 4. REGISTERS         → Filtered data tables & transaction lists        │
│ 5. DRILLDOWN REPORTS → Detailed financial & operational analysis      │
│ 6. SOURCE RECORDS    → Audited vouchers, shift logs, & invoices         │
└────────────────────────────────────────────────────────────────────────┘
```

The fundamental architectural shift: **Reports are sub-components of Workspaces, not the front door of the system.**

---

### 26.2 Role-Based Workspace Specifications

FuelPro enforces three distinct, role-optimized Workspaces upon user login:

#### 1. Salesman Workspace (شفٹ سیلز مین ورکسپیس)
- **Goal:** Zero distraction, 100% operational speed.
- **Visible Elements:**
  - Active Shift Status & Timer
  - Current Nozzle Meter Readings (`Previous → Current`)
  - Quick Cash Collection Calculator
  - Udhaar / Customer Credit Entry
  - Attendance & Shift Handover / Logout
- **Strict Prohibition:** Denied access to station profit, supplier ledgers, station expenses, or multi-shift financial analytics.

#### 2. Station Manager Workspace (اسٹیشن مینیجر ورکسپیس)
- **Goal:** Daily operational efficiency, staff management, and stock maintenance.
- **Visible Elements:**
  - Today's Live Sales & Liters Summary
  - Active Shift Progress & Variance Alerts (Shortages > ₨500)
  - Fuel Tank Gauges (`Low Stock Warnings`)
  - Staff Attendance & Shift Approvals
  - Daily Expenses & Customer Recovery Entries
  - Operational Reports Menu (A–Z Filtered)

#### 3. Owner Executive Workspace (مالک کنٹرول روم ورکسپیس)
- **Goal:** Total financial visibility, cash flow security, and high-level decision making.
- **Visible Elements:**
  - True Profit Waterfall (`Gross Sales - Cost - Expenses = True Profit`)
  - Real-time Cash Position (Cash in Hand + Bank + Digital Wallets)
  - Station Stock & Reorder Forecasting
  - Customer Outstanding Aging (> 60 Days Overdue)
  - Multi-Branch Performance Comparison
  - AI Recommendations & Root Cause Summaries

---

### 26.3 The Widget Engine & Adaptive Grid

Workspaces are built using a modular, drag-and-drop **Widget Engine**. Each visual element is an isolated, self-contained Widget registered in the Widget Registry:

| Widget ID | Renderer Type | Responsive Grid Span | Description |
|---|---|---|---|
| `WIDGET_KPI_CARD` | Metric Tile | 1 Col (Mobile) / 2 Col (Tablet) | Single KPI with trend arrow and color wash |
| `WIDGET_TANK_GAUGE` | Circular Gauge | 2 Col (Mobile) / 3 Col (Desktop) | Realtime fuel level, fill %, and reorder status |
| `WIDGET_PROFIT_WATERFALL` | Step Chart | 4 Col (Desktop) | 5-step profit deduction waterfall |
| `WIDGET_REGISTER_TABLE` | Data Grid | 4 Col (Desktop) | Filterable, paginated transaction register |
| `WIDGET_AI_INSIGHT_CARD` | Text + Action | 4 Col (Desktop) | Plain-Urdu AI summary with action buttons |
| `WIDGET_TASK_LIST` | Action Cards | 2 Col (Desktop) | Pending approvals, low stock orders, recoveries |

**User Layout Persistence:** Every user can customize, reorder, pin, or hide widgets on their Workspace. The layout configuration is persisted in Firestore under `users/{userId}/workspaceConfig`.

---

### 26.4 Global Action Center (`+` Quick Actions Everywhere)

No matter where a user is within the ERP, a persistent **Global Action Center** (accessible via a floating `+` button and top header shortcut) grants one-tap access to primary operational actions:

```
[ + Quick Action ]
  ├── ⛽ New Fuel Sale / Shift Entry
  ├── 💸 New Expense Record
  ├── 🚚 New Fuel Purchase Delivery
  ├── 👤 New Customer Credit Entry
  ├── 💵 Record Customer Recovery
  └── 🏦 Bank Deposit Entry
```

This decouples transaction creation from navigation — users never have to "find the right screen" to record an event.

---

### 26.5 Global Context Engine (Context Propagation)

When a user filters by a specific entity (e.g. selecting `Tank #1 (Petrol)` or `Customer: Ali Transport`), the **Global Context Engine** propagates that context across the entire application:

```
User selects: Context = { tankId: "tank-1", product: "Petrol" }
     │
     ├── Inventory Workspace → Automatically highlights Tank #1
     ├── Meter Readings (M)  → Automatically filters to Tank #1 Nozzles
     ├── Purchase History (H)→ Automatically filters to Petrol deliveries
     └── Fuel Sales (F)      → Automatically scopes to Petrol volume
```

Selecting a context once updates all sub-views, registers, and reports simultaneously without requiring manual re-filtering.

---

### 26.6 Smart Universal Search (`Ctrl + K` Command Palette)

FuelPro includes a lightning-fast universal search engine accessible via `Ctrl + K` (Desktop) or the top navigation bar (Mobile):

```
🔍 Type anything... (e.g., "diesel", "ali", "shift 42", "pso")

Search Results:
├── 🛢️ Tank Stock: Diesel Tank #2 (4,820 L remaining)
├── 📊 Report: F — Fuel Sales (Diesel)
├── 👤 Customer: Ali Transport (₨ 85,000 balance)
├── 🚚 Supplier Invoice: PSO Delivery #482 (07 Aug)
└── ⚙️ Action: Create New Fuel Purchase Order
```

Searching queries all entity indexes (Reports, Customers, Suppliers, Tanks, Invoices, Staff, Transactions) in under 150ms.

---

### 26.7 Platform Notification & Task Center

Notifications in FuelPro are actionable tasks, not passive messages. Every notification is paired with a direct resolution action:

| Notification Event | Severity | Target Role | Direct Action Button |
|---|---|---|---|
| `LOW_STOCK_PETROL` | 🔴 Critical | Manager, Owner | `[ 🛒 Create Purchase Order ]` |
| `CUSTOMER_OVERDUE_60D` | ⚠️ Warning | Owner, Manager | `[ 💬 Send WhatsApp Reminder ]` |
| `SHIFT_VARIANCE_HIGH` | 🔴 Critical | Manager, Owner | `[ 🔍 Review Shift #48 ]` |
| `SALARY_APPROVAL_DUE` | ℹ️ Info | Owner | `[ 💰 Approve Payroll ]` |
| `SUPPLIER_PAYMENT_DUE` | ⚠️ Warning | Accountant, Owner | `[ 🏦 Settle Payment ]` |

---

### 26.8 Cross-Module Drilldown Chains

FuelPro enables continuous, uninterrupted data traversal across module boundaries:

```
[ Petrol Stock Gauge ] 
       │ (Tap: View Stock Movement)
       ▼
[ Petrol Purchase History ] 
       │ (Tap: View Delivery Invoice #482)
       ▼
[ Supplier Invoice (PSO) ] 
       │ (Tap: View Supplier Ledger)
       ▼
[ Supplier Payment Entry ] 
       │ (Tap: View Bank Withdrawal)
       ▼
[ Bank Cash Ledger ] 
       │ (Tap: Impact on Monthly Profit)
       ▼
[ True Profit Waterfall (P1) ]
```

Users can trace operational physical fluid (liters in tank) to financial outflow (bank payment) and ultimate business impact (profit) in a single seamless flow.

---

### 26.9 Workspace Memory & AI Adaptive UX

The system actively learns user behavior patterns:

1. **Frequently Visited Promotion:** If an Owner opens `True Profit (P1)` and `Cash Book (C1)` every morning at 8:30 AM, the AI Adaptive UX automatically pins those two cards to the top of their morning Workspace.
2. **Context-Aware Action Prompting:** If a shift closes with a cash shortage, the Manager's Workspace automatically surfaces the Variance Resolution tool at the top of their feed.
3. **Adaptive Form Layouts:** Form fields dynamically adjust based on historical entries (e.g. defaulting to the most frequently purchased fuel grade or supplier).

---

### 26.10 No-Code Custom Report Builder

For advanced station owners operating multi-company or complex stations, FuelPro provides a drag-and-drop **Custom Report Builder**:

- **Canvas Mode:** Combine any 2+ metrics from different modules (e.g. `Petrol Sales` + `Staff Food Expense` + `Bank Balance`).
- **Formula Linking:** Apply custom mathematical expressions using the central Formula Registry (Part 17).
- **One-Tap Save:** Save custom layouts as private reports added directly to the user's personal A–Z menu.

---

## PART 27 — THE 10/10 PLATFORM ARCHITECTURE MATRIX

With the completion of Parts 1–26, FuelPro Enterprise stands as a complete 10/10 Master Platform Blueprint:

| Layer # | Platform Architecture Layer | Covered In | Operational Standard |
|---|---|---|---|
| **Layer 1** | **User Experience & Bilingual UX** | Parts 1, 14, 25 | Three-Second Rule, 100% Urdu/English, Accessibility |
| **Layer 2** | **A–Z Complete Report Specifications** | Part 2 (A–Z) | 30+ Complete Petroleum Domain Reports |
| **Layer 3** | **Realtime Firebase Database Engine** | Parts 3, 8 | Zero Dummy Data, Firestore Snapshots, Offline First |
| **Layer 4** | **Role-Based Security & Permissions** | Part 5 | RBAC Matrix (Owner, Manager, Cashier, Accountant) |
| **Layer 5** | **Engine-Centric Core Stack** | Part 15 | 6-Layer Architecture, JSON Manifest System |
| **Layer 6** | **Engine Type Classification** | Part 16 | 14 Standardized Engine Renderers |
| **Layer 7** | **Single Source of Truth Formula Registry** | Part 17 | 19 Canonical Versioned Formulas |
| **Layer 8** | **Declarative Business Rule Engine** | Part 18 | 25 Automated Business Thresholds & Alerts |
| **Layer 9** | **Report Dependency DAG** | Part 19 | Build-time Graph, Cascade Invalidation |
| **Layer 10** | **Enterprise Metadata Registry** | Part 20 | 26-Field Machine-Readable Schema |
| **Layer 11** | **Performance & Resource Budgets** | Part 21 | Sub-500ms KPI targets, Firestore Read Caps |
| **Layer 12** | **4-Level Caching Hierarchy** | Part 22 | L1 Zustand → L2 IndexedDB → L3 Firestore → L4 Cloud Func |
| **Layer 13** | **Enterprise AI Intelligence Engine** | Part 23 | 7 Deterministic AI Capabilities & Governance |
| **Layer 14** | **10-Year Scalability & Extension Roadmap**| Part 24 | Fuel → Lube → CNG → Fleet → Manufacturing |
| **Layer 15** | **Business-First Progressive Disclosure** | Part 25 | Golden Layout Mandate, Diagnostics Isolation |
| **Layer 16** | **Enterprise Workspace Platform (EWP)** | Part 26 | Role Workspaces, Widget Engine, Action Center, Search |

---

**مکمّل سسٹمی اعلان: FuelPro Enterprise Intelligence & Workspace Platform اب دنیائے سافٹ ویئر کا 10/10 ماسٹر بلیو پرنٹ بن چکا ہے۔ بزنس، یو ایکس، آرکیٹیکچر، سیکیورٹی، پرفارمنس، اے آئی اور ورکسپیس — ہر پہلو مکمل اور مستحکم ہے۔**

---

## PART 28 — BASELINE SPECIFICATION FREEZE & PROGRESSIVE BUILD ROADMAP

### 28.1 PRD Specification Freeze Declaration

Per executive steering direction, **this PRD is officially FROZEN as the v3.0 Baseline Specification.**

No further theoretical architecture chapters (Part 29, 30+) will be added. All future efforts transition immediately from specification design to **progressive software build and iterative delivery.**

### 28.2 The Supreme Law of Execution: Working Software > Perfect Architecture

While Parts 1–27 establish an unassailable 10/10 enterprise platform blueprint, operational software value exists **only when working screens process real Firebase data for real pump operators.**

The platform build strictly adheres to the principle of **Business-First Progressive Build**:
- Deliver working, live, simple business screens first.
- Activate advanced underlying engines (Caching, AI, Rules, Workspaces) progressively behind proven operational screens.
- Never delay working software to build isolated theoretical abstractions.

---

### 28.3 Enterprise Design System (EDS) Standard

Every single report screen and data register across FuelPro **MUST** adhere to the standardized Enterprise Design System (EDS) contracts:

#### Screen Layout Standard:
```
┌────────────────────────────────────────────────────────┐
│ 1. Enterprise Header (Bilingual Title + Branch Context) │
├────────────────────────────────────────────────────────┤
│ 2. Universal Date Filter Bar (Today|Yest|Week|Month|Cust)│
├────────────────────────────────────────────────────────┤
│ 3. Live KPI Cards Grid (Explicit Product Split & Status)│
├────────────────────────────────────────────────────────┤
│ 4. Visual Gauges & Charts (Tank Fill Bars, Visual Trends)│
├────────────────────────────────────────────────────────┤
│ 5. Advanced Search & Filter Bar (Live Instant Filter)   │
├────────────────────────────────────────────────────────┤
│ 6. Main Data Register (Filterable Data Table / List)   │
├────────────────────────────────────────────────────────┤
│ 7. Pagination & Totals Summary Row                     │
├────────────────────────────────────────────────────────┤
│ 8. Universal Export Bar (PDF | Excel | Print | WhatsApp)│
└────────────────────────────────────────────────────────┘
```

#### Register Table Standard:
Every Register Table must provide:
`Live Search` + `Advanced Filters` + `Column Chooser` + `Multi-Column Sort` + `Export (PDF/Excel/WhatsApp)` + `Pagination` + `Live Totals Row` + `Clickable Drilldown Rows`.

#### Explicit Product Presentation Standard:
Never display generic aggregated numbers without explicit product breakdown.
```
❌ WRONG:   Total Stock: 7,000 L

✅ CORRECT: ⛽ Petrol: 2,850 L  ████████░░ (57%)  [⚠️ Low Stock]
            🛢 Diesel: 4,150 L  ██████████░ (83%) [✅ Healthy]
```

---

### 28.4 Progressive Build Execution Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: OPERATIONAL MVP (Core 10 Live Firebase Reports)               │
│  1. Aaj Ka Khulasa (Today's Summary Dashboard)                         │
│  2. Fuel Sales Report (F)                                             │
│  3. Inventory & Tank Stock Report (I) — Explicit Petrol/Diesel Gauges  │
│  4. Purchase History Report (H)                                       │
│  5. Cash Book / Rokar Bahi (C1)                                        │
│  6. Bank Cash Ledger (B)                                              │
│  7. Expenses Report (E)                                               │
│  8. Customer Ledger / Udhaar (L1)                                     │
│  9. Supplier Ledger (L2)                                              │
│ 10. Shift Summary Logs (S2)                                           │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: UNIVERSAL REGISTER ENGINE                                     │
│  • Standardized search, column chooser, export & pagination engine    │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: 4-LEVEL PROGRESSIVE DRILLDOWN                                 │
│  • KPI Card → Register → Transaction Document → Source Firebase Record│
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: DETERMINISTIC AI INTELLIGENCE LAYER                           │
│  • Plain-Urdu Summaries, Root Cause Analysis, Anomaly Badges           │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 5: ROLE-BASED WORKSPACES                                         │
│  • Salesman, Manager, and Owner Executive Workspaces & Action Center   │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 6: NO-CODE CUSTOM REPORT BUILDER                                 │
│  • Drag-and-drop report canvas & private custom report saving         │
└────────────────────────────────────────────────────────────────────────┘
```

---

**حتمی منطقی انجام: PRD یہاں فریز کر دی گئی ہے۔ اب ایک ایک کر کے فیز 1 کے 10 بنیادی رپورٹس لائیو فائر بیس ڈیٹا پر تیار کیے جائیں گے، جن کا UX 100% بزنس فرسٹ اور آسان ہوگا۔**
