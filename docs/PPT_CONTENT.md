# SR UNIVERSITY HACKATHON 2026
## Web Technologies and Mobile Programming
### Project Presentation: Smart Parking Platform (SPP)

---

## Slide 1: Title Slide
* **Project Title:** Smart Parking Platform (SPP)
* **Domain:** Smart Campus / Intelligent Transportation Systems (ITS)
* **Theme:** Web Technologies & Mobile Programming Hackathon 2026
* **Institution:** SR University
* **Tagline:** Automated real-time parking discovery, visual bay reservation, and facility management.

---

## Slide 2: Problem Statement
Urban hubs, university campuses, and commercial complexes suffer from chaotic parking management. Drivers spend excessive time circling crowded lots in search of open bays, leading to:
* Severe traffic bottlenecks at entry gates.
* Increased carbon footprint and wasted fuel.
* Frustration, delayed class arrivals, and unproductive transit time.
* Inefficient utilization of existing parking spaces due to lack of real-time visibility.

---

## Slide 3: Existing Problem (Current System Limitations)
* **Manual Parking Attendants:** Gate guards manually issue paper tokens with no automated tracking of open slots.
* **Lack of Pre-Arrival Visibility:** Drivers arrive at a facility only to discover all bays are occupied.
* **No Slot Specificity:** Conventional boards indicate "Parking Full" or "Parking Open" without showing which specific bay is open.
* **Payment Inefficiencies:** Manual cash or physical token collection leads to long queues during peak campus hours.
* **Zero Analytics:** Administrators lack historical logs, occupancy metrics, or revenue tracking.

---

## Slide 4: Proposed Solution
The **Smart Parking Platform (SPP)** is a full-stack, responsive web application that bridges drivers and parking facilities through an intuitive, automated digital interface:
1. **Real-Time Lot Catalog:** Instant discovery of campus parking lots with live availability counts.
2. **Interactive 2D Parking Grid:** Visual map showing slot statuses with standard green (available), red (occupied), and orange (reserved) color coding.
3. **Pre-Booking & Guaranteed Bay:** Users reserve specific bays for desired time windows and obtain digital entry passes with booking IDs.
4. **Role-Based Portals:** Dedicated user dashboard for drivers and an administrative console for parking marshals to monitor lots and override slot statuses.

---

## Slide 5: Project Objectives
* **Eliminate Parking Search Time:** Reduce average campus parking search time from 15 minutes to under 2 minutes.
* **Promote Eco-Friendly Transit:** Minimize fuel consumption and emissions caused by repetitive campus circling.
* **Provide 100% Transparency:** Give users an honest, live view of slot layout, tariffs, and facility proximity.
* **Streamline Facility Management:** Equip campus administrators with tools to add lots, monitor live occupancy percentages, and manage turnover.
* **Deliver Responsive Accessibility:** Ensure seamless usability across desktops, tablets, and mobile devices without requiring heavy native downloads.

---

## Slide 6: Main Features
### Driver / User Features:
* **Interactive Landing & Discovery:** Search lots by block, campus gate, or landmark.
* **Visual Slot Bay Selector:** Clickable green bays with real-time selection feedback.
* **Transparent Tariff Calculator:** Instant pricing preview based on chosen duration.
* **Digital Pass & Voucher Generation:** Instant on-screen pass with Booking ID, bay number, and print option.
* **User Dashboard:** Centralized view of active passes, booking history, and campus parking stats.

### Admin / Marshal Features:
* **Facility Management:** Add new campus lots, edit capacities, and update hourly tariffs.
* **Slot Bay Control & Overrides:** Manually toggle slot status between Available and Occupied for maintenance or VIP arrival.
* **Live Reservation Ledger:** Monitor all active and completed bookings with quick release actions.

### Security & Role-Based Access Control (RBAC):
* **Strict Server-Side Authorization:** Zero reliance on client-side localStorage; authorization validated against MongoDB sessions.
* **Protected Administrative URLs:** Direct URL navigation to `/admin.html` by standard users strictly yields HTTP 403 Access Denied.
* **Privilege Escalation Prevention:** Registration API enforces `USER` role and ignores self-assignment of `ADMIN`.
* **Stateful Sessions:** Secure, `HttpOnly` cookie-backed sessions stored in MongoDB with 24-hour TTL.

---

## Slide 7: Technology Stack
* **Frontend:**
  * **HTML5:** Semantic, accessible layout structure.
  * **CSS3:** Custom responsive design system with CSS custom properties (variables), Flexbox, and CSS Grid.
  * **JavaScript (ES6+):** Pure Vanilla JS for dynamic slot interactions, form validation, and event handling (Zero bulky external framework overhead).
* **Backend:**
  * **Node.js (v26+):** High-performance, event-driven JavaScript runtime.
  * **Express.js:** Lightweight routing and middleware framework.
* **Database:**
  * **MongoDB & Mongoose:** Document database for parking lots, bay structures, user accounts, and reservations.
* **Tools & Version Control:**
  * **Git / GitHub:** Branch-based version control (`main` branch).
  * **NPM & Nodemon:** Package management and hot-reloading development server.

---

## Slide 8: System Architecture
```
+-------------------------------------------------------------+
|                     CLIENT TIER (Frontend)                 |
|  - HTML5 Pages (Landing, Lots, Grid, Booking, Dashboards)   |
|  - Vanilla JavaScript Modules (slots.js, booking.js, main) |
|  - Custom Responsive CSS (style.css)                        |
+------------------------------+------------------------------+
                               |  HTTP / JSON (REST API)
                               v
+-------------------------------------------------------------+
|                    APPLICATION SERVER TIER                  |
|  - Node.js & Express.js Server (server.js)                 |
|  - Static Asset Middleware (public/)                        |
|  - RESTful Endpoints (Lots, Slots, Bookings, Auth)          |
|  - Business Logic & Slot State Validation                   |
+------------------------------+------------------------------+
                               |  Mongoose ODM (Port 27017)
                               v
+-------------------------------------------------------------+
|                      DATA TIER (Database)                   |
|  - MongoDB (smart_parking database)                         |
|  - Collections: Users, Lots, Slots, Reservations            |
+-------------------------------------------------------------+
```

---

## Slide 9: Expected Output & Deliverables
1. **Fully Working Responsive UI:** Clean multi-page frontend covering all 8 hackathon module specifications.
2. **Visual Color-Coded Bay Map:** Clear visual representation of open, occupied, and reserved parking bays.
3. **End-to-End User Flow:** Seamless progression from Lot Discovery → Slot Selection → Duration & Details → Instant Booking Voucher.
4. **Faculty Evaluation Ready:** Beginner-friendly, modular code with transparent variable names and zero AI boilerplate fluff.
