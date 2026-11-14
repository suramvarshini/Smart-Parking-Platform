/**
 * Smart Parking Platform - Presentation (.pptx) Generator
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

async function createPresentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 16:9 widescreen layout

  // Color Palette Constants
  const NAVY = '1E3A8A';
  const BLUE = '2563EB';
  const DARK = '0F172A';
  const GRAY = '64748B';
  const LIGHT_BG = 'F8FAFC';
  const GREEN = '16A34A';
  const CARD_BG = 'FFFFFF';

  // Helper: Standard Slide Header
  function addHeader(slide, title, category = 'SMART PARKING PLATFORM | SR UNIVERSITY HACKATHON 2026') {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: '100%', h: 1.1,
      fill: { color: NAVY }
    });
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.2, w: 10, h: 0.25,
      fontSize: 10, color: '93C5FD', bold: true
    });
    slide.addText(title, {
      x: 0.8, y: 0.45, w: 11, h: 0.5,
      fontSize: 22, color: 'FFFFFF', bold: true
    });
  }

  // Helper: Slide Footer
  function addFooter(slide, pageNum) {
    slide.addShape(pres.shapes.LINE, {
      x: 0.8, y: 7.0, w: 11.7, h: 0,
      line: { color: 'CBD5E1', width: 1 }
    });
    slide.addText('SR University Hackathon 2026 — Web Technologies & Mobile Programming', {
      x: 0.8, y: 7.05, w: 9, h: 0.3,
      fontSize: 9, color: GRAY
    });
    slide.addText(`Slide ${pageNum}`, {
      x: 10.5, y: 7.05, w: 2.0, h: 0.3,
      fontSize: 9, color: GRAY, align: 'right'
    });
  }

  // -------------------------------------------------------------
  // SLIDE 1: Title & Team Details
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    slide.addText('SR UNIVERSITY HACKATHON 2026', {
      x: 1.0, y: 1.5, w: 11, h: 0.4,
      fontSize: 14, color: '93C5FD', bold: true, letterSpacing: 2
    });
    slide.addText('Smart Parking Platform (SPP)', {
      x: 1.0, y: 2.0, w: 11, h: 1.0,
      fontSize: 38, color: 'FFFFFF', bold: true
    });
    slide.addText('Automated Real-Time Parking Space Discovery, Visual Bay Reservation & Facility Management System', {
      x: 1.0, y: 3.1, w: 10.5, h: 0.8,
      fontSize: 16, color: 'E2E8F0'
    });

    // Team Details Box
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 4.4, w: 11.3, h: 2.2,
      fill: { color: '172554' }, line: { color: BLUE, width: 1.5 }
    });
    slide.addText('PROJECT & TEAM DETAILS', {
      x: 1.3, y: 4.6, w: 10, h: 0.3,
      fontSize: 12, color: '60A5FA', bold: true
    });
    slide.addText([
      { text: '• Institution: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'SR University\n', options: { color: 'E2E8F0' } },
      { text: '• Track: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'Web Technologies & Mobile Programming Hackathon 2026\n', options: { color: 'E2E8F0' } },
      { text: '• Team Name: ', options: { bold: true, color: 'FFFFFF' } },
      { text: '[Team Name / Number Placeholder]\n', options: { color: '93C5FD' } },
      { text: '• Team Members: ', options: { bold: true, color: 'FFFFFF' } },
      { text: '[Student Name 1 (Lead), Student Name 2, Student Name 3]\n', options: { color: '93C5FD' } },
      { text: '• Faculty Mentor / Evaluator: ', options: { bold: true, color: 'FFFFFF' } },
      { text: '[Department Faculty Mentor Placeholder]', options: { color: 'E2E8F0' } }
    ], {
      x: 1.3, y: 5.0, w: 10.5, h: 1.5,
      fontSize: 12, lineSpacing: 22
    });
  }

  // -------------------------------------------------------------
  // SLIDE 2: Problem Statement
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Problem Statement');
    addFooter(slide, 2);

    slide.addText('Urban and campus parking infrastructure faces critical operational challenges:', {
      x: 0.8, y: 1.4, w: 11.7, h: 0.4, fontSize: 14, color: DARK, bold: true
    });

    const problems = [
      {
        icon: '🚗 15–20 Min Delay',
        title: 'Severe Traffic Bottlenecks',
        desc: 'Drivers waste significant time circling university campus blocks and commercial structures in search of an open bay, clogging entry gates.'
      },
      {
        icon: '⛽ Fuel Wastage',
        title: 'Environmental Footprint',
        desc: 'Unproductive idling and repeated circling consume excessive fuel and generate preventable carbon emissions on campus.'
      },
      {
        icon: '❓ Zero Visibility',
        title: 'Lack of Real-Time Information',
        desc: 'Drivers have no way of knowing whether a facility is full before physically reaching the boom barrier.'
      },
      {
        icon: '📋 Manual Inefficiencies',
        title: 'Paper Tokens & Queues',
        desc: 'Manual gate attendants issue handwritten paper slips with zero digital audit logs, revenue transparency, or live bay tracking.'
      }
    ];

    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 6.0;
      const y = 2.0 + row * 2.4;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 5.6, h: 2.1,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addText(p.icon, {
        x: x + 0.3, y: y + 0.25, w: 5.0, h: 0.35,
        fontSize: 13, color: 'DC2626', bold: true
      });
      slide.addText(p.title, {
        x: x + 0.3, y: y + 0.65, w: 5.0, h: 0.35,
        fontSize: 14, color: NAVY, bold: true
      });
      slide.addText(p.desc, {
        x: x + 0.3, y: y + 1.05, w: 5.0, h: 0.9,
        fontSize: 11, color: GRAY, lineSpacing: 16
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 3: Proposed Solution
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Proposed Solution');
    addFooter(slide, 3);

    slide.addText('Smart Parking Platform (SPP) — A Full-Stack Intelligent Reservation System', {
      x: 0.8, y: 1.4, w: 11.7, h: 0.4, fontSize: 14, color: DARK, bold: true
    });

    const solutions = [
      {
        title: 'Real-Time Facility Catalog',
        desc: 'Instantly view all campus parking facilities with live counts for total, available, and occupied bays.'
      },
      {
        title: 'Interactive 2D Visual Grid',
        desc: 'Color-coded visual layout (Green: Available, Red: Occupied, Orange: Reserved) with clickable slot selection.'
      },
      {
        title: 'Time-Window Conflict Prevention',
        desc: 'Smart scheduling engine that prevents double-booking and overlapping reservations across arbitrary time windows.'
      },
      {
        title: 'Digital Pass & Instant Cancellation',
        desc: 'Generates unique printable booking passes (#BK-xxxx). Cancelling instantly restores live bay availability in MongoDB.'
      },
      {
        title: 'Role-Based Access Control (RBAC)',
        desc: 'JWT and HttpOnly cookie-authenticated portals separating student/faculty drivers from campus marshals.'
      },
      {
        title: 'Zero Dummy Data',
        desc: 'Every reservation, lot, and bay is persistently recorded, indexed, and retrieved from MongoDB.'
      }
    ];

    solutions.forEach((s, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 4.0;
      const y = 2.0 + row * 2.3;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 3.7, h: 2.0,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 3.7, h: 0.08,
        fill: { color: BLUE }
      });
      slide.addText(s.title, {
        x: x + 0.25, y: y + 0.2, w: 3.2, h: 0.45,
        fontSize: 13, color: NAVY, bold: true
      });
      slide.addText(s.desc, {
        x: x + 0.25, y: y + 0.7, w: 3.2, h: 1.1,
        fontSize: 11, color: GRAY, lineSpacing: 16
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 4: Project Objectives
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Project Objectives');
    addFooter(slide, 4);

    const objectives = [
      { metric: '< 2 Mins', goal: 'Reduce Parking Search Time', detail: 'Cut average campus parking hunt from 15 minutes to under 2 minutes through pre-arrival reservation.' },
      { metric: '100% Digital', goal: 'Eliminate Paper Tokens', detail: 'Transition completely to digital passes with booking IDs and automated security checks.' },
      { metric: 'Zero Conflict', goal: 'Prevent Double-Booking', detail: 'Implement robust database-level overlap validation for simultaneous booking attempts.' },
      { metric: 'Strict RBAC', goal: 'Protect Campus Administration', detail: 'Enforce JWT-based route and API guards so unauthorized users cannot access facility tools.' },
      { metric: '100% Responsive', goal: 'Universal Device Accessibility', detail: 'Deliver fluid mobile and desktop interfaces using pure semantic HTML5 and vanilla CSS.' }
    ];

    objectives.forEach((obj, idx) => {
      const y = 1.6 + idx * 1.0;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y, w: 11.7, h: 0.85,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y, w: 2.2, h: 0.85,
        fill: { color: NAVY }
      });
      slide.addText(obj.metric, {
        x: 0.8, y: y + 0.2, w: 2.2, h: 0.45,
        fontSize: 14, color: 'FFFFFF', bold: true, align: 'center'
      });
      slide.addText(obj.goal, {
        x: 3.2, y: y + 0.12, w: 8.5, h: 0.3,
        fontSize: 13, color: NAVY, bold: true
      });
      slide.addText(obj.detail, {
        x: 3.2, y: y + 0.42, w: 8.5, h: 0.35,
        fontSize: 11, color: GRAY
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 5: Technology Stack
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Technology Stack');
    addFooter(slide, 5);

    const stack = [
      {
        tier: 'FRONTEND TIER',
        color: '0284C7',
        techs: [
          'HTML5: Semantic, accessible web standards',
          'CSS3: Custom responsive design system (Flexbox & CSS Grid)',
          'JavaScript (ES6+): Pure Vanilla JS for DOM and Fetch API',
          'Zero Heavy Frameworks: Fast load times, lightweight footprint'
        ]
      },
      {
        tier: 'APPLICATION BACKEND',
        color: '2563EB',
        techs: [
          'Node.js (v26+): High-throughput event-driven runtime',
          'Express.js: Modular RESTful routing & middleware',
          'JSON Web Tokens (jsonwebtoken): Stateless RBAC security',
          'SHA-256 + Salt: Deterministic secure password hashing'
        ]
      },
      {
        tier: 'DATABASE LAYER',
        color: '16A34A',
        techs: [
          'MongoDB Server (Port 27017): Document datastore',
          'Mongoose ODM: Strict schemas, validation & relationships',
          'Database Name: smart_parking_db',
          'Compound Indexes: Unique slots & rapid conflict detection'
        ]
      }
    ];

    stack.forEach((s, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.6, w: 3.7, h: 5.0,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.6, w: 3.7, h: 0.7,
        fill: { color: s.color }
      });
      slide.addText(s.tier, {
        x, y: 1.75, w: 3.7, h: 0.4,
        fontSize: 13, color: 'FFFFFF', bold: true, align: 'center'
      });

      s.techs.forEach((t, i) => {
        slide.addText('✔ ' + t, {
          x: x + 0.25, y: 2.6 + i * 1.0, w: 3.2, h: 0.8,
          fontSize: 11, color: DARK, lineSpacing: 16
        });
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 6: System Architecture
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'System Architecture');
    addFooter(slide, 6);

    slide.addText('3-Tier Client-Server-Database Architecture with Middleware Guards', {
      x: 0.8, y: 1.35, w: 11.7, h: 0.35, fontSize: 13, color: GRAY, bold: true
    });

    const boxes = [
      {
        title: 'CLIENT TIER (Presentation)',
        sub: 'Browser Views',
        desc: '• Landing Page, Lots Directory, Slot Layout\n• User & Admin Dashboards\n• Fetch API (Bearer Token / HttpOnly Cookies)',
        color: '0369A1', y: 1.8
      },
      {
        title: 'SERVER TIER (Express.js REST Engine)',
        sub: 'Security, Routing & Conflict Validation',
        desc: '• Middleware: requireAuth, requireAdmin (RBAC Guards)\n• Dynamic Time-Window Conflict Engine\n• REST Endpoints: /api/auth, /api/parking-lots, /api/bookings, /api/admin',
        color: '1E3A8A', y: 3.5
      },
      {
        title: 'DATA TIER (MongoDB Persistence)',
        sub: 'smart_parking_db',
        desc: '• Users Collection (Roles, Passwords)\n• ParkingLots & ParkingSlots Collections\n• Bookings Collection (Active & Completed Passes)\n• Sessions Collection (TTL 24-hr stateful tokens)',
        color: '15803D', y: 5.2
      }
    ];

    boxes.forEach(b => {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: b.y, w: 11.7, h: 1.4,
        fill: { color: 'FFFFFF' }, line: { color: b.color, width: 2 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y: b.y, w: 3.5, h: 1.4,
        fill: { color: b.color }
      });
      slide.addText(b.title, {
        x: 1.0, y: b.y + 0.3, w: 3.1, h: 0.4,
        fontSize: 12, color: 'FFFFFF', bold: true
      });
      slide.addText(b.sub, {
        x: 1.0, y: b.y + 0.7, w: 3.1, h: 0.3,
        fontSize: 10, color: 'E2E8F0'
      });
      slide.addText(b.desc, {
        x: 4.6, y: b.y + 0.15, w: 7.6, h: 1.1,
        fontSize: 11, color: DARK, lineSpacing: 18
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 7: Database Design (Mongoose Models & Schema)
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Database Design & Mongoose Schemas');
    addFooter(slide, 7);

    const models = [
      {
        name: 'User Model',
        fields: '• name (String)\n• email (String, Unique)\n• password (SHA-256 Hash)\n• phone (String)\n• role (Enum: USER, ADMIN)\n• vehicleNo (String)\n• createdAt (Date)'
      },
      {
        name: 'ParkingLot Model',
        fields: '• name (String, Unique)\n• location & address (String)\n• totalSlots (Number, min: 1)\n• availableSlots (Number)\n• hourlyRate (Number)\n• operatingHours (String)\n• createdAt (Date)'
      },
      {
        name: 'ParkingSlot Model',
        fields: '• parkingLot (ObjectId, ref)\n• slotNumber (String, e.g. A-01)\n• slotType (Enum: Car, Bike)\n• status (AVAILABLE, OCCUPIED, RESERVED)\n• Compound Unique Index:\n  { parkingLot: 1, slotNumber: 1 }'
      },
      {
        name: 'Booking Model',
        fields: '• bookingId (String, Unique)\n• user (ObjectId, ref)\n• parkingLot (ObjectId, ref)\n• parkingSlot (ObjectId, ref)\n• vehicleNumber & vehicleType\n• bookingDate, startTime, endTime\n• duration & totalAmount\n• bookingStatus (CONFIRMED/CANCELLED)'
      }
    ];

    models.forEach((m, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.6, w: 2.8, h: 5.0,
        fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.6, w: 2.8, h: 0.5,
        fill: { color: NAVY }
      });
      slide.addText(m.name, {
        x, y: 1.7, w: 2.8, h: 0.3,
        fontSize: 12, color: 'FFFFFF', bold: true, align: 'center'
      });
      slide.addText(m.fields, {
        x: x + 0.15, y: 2.3, w: 2.5, h: 4.1,
        fontSize: 10, color: DARK, lineSpacing: 18
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 8: Main Features
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Main Platform Features');
    addFooter(slide, 8);

    const feats = [
      { title: 'Campus Facility Search', text: 'Search lots by campus gate, landmark, or department block with real-time open bay counts.' },
      { title: 'Interactive 2D Bay Map', text: 'Visual representation of parking bays with clear status coloring (Green: Open, Red: Full, Orange: Reserved).' },
      { title: 'Smart Tariff Calculator', text: 'Automatically calculates fee based on hourly tariff and scheduled arrival duration.' },
      { title: 'Digital Pass Generation', text: 'Instant digital ticket with verifiable #BK-xxxx booking ID and printable summary.' },
      { title: 'Self-Service Cancellation', text: 'Drivers can cancel active reservations anytime, instantly releasing the bay back to the public pool.' },
      { title: 'Admin Lot & Bay Control', text: 'Campus facility supervisors can add new lots, create bays, and toggle slot availability for maintenance.' }
    ];

    feats.forEach((f, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 6.0;
      const y = 1.6 + row * 1.7;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 5.7, h: 1.5,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addText('✔ ' + f.title, {
        x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.35,
        fontSize: 13, color: NAVY, bold: true
      });
      slide.addText(f.text, {
        x: x + 0.3, y: y + 0.55, w: 5.1, h: 0.8,
        fontSize: 11, color: GRAY, lineSpacing: 16
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 9: User Workflow
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'User Workflow');
    addFooter(slide, 9);

    const steps = [
      { step: '1', title: 'Register / Log In', desc: 'User logs in as Driver/Student. System issues secure JWT token and redirects to User Dashboard.' },
      { step: '2', title: 'Select Facility', desc: 'Browse campus parking lots directory, search by campus block, and review hourly rates.' },
      { step: '3', title: 'Filter by Time & Pick Bay', desc: 'Choose arrival date, start time, duration, and click an open green bay in Lane A or B.' },
      { step: '4', title: 'Confirm Reservation', desc: 'Review order summary, enter vehicle registration number, and submit to database.' },
      { step: '5', title: 'Digital Pass & Park', desc: 'Receive instant #BK-xxxx digital pass. Present pass at gate and park without delay.' }
    ];

    steps.forEach((s, idx) => {
      const x = 0.8 + idx * 2.38;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.0, w: 2.2, h: 4.4,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.65, y: 2.3, w: 0.9, h: 0.9,
        fill: { color: BLUE }
      });
      slide.addText(s.step, {
        x: x + 0.65, y: 2.45, w: 0.9, h: 0.6,
        fontSize: 18, color: 'FFFFFF', bold: true, align: 'center'
      });
      slide.addText(s.title, {
        x: x + 0.15, y: 3.4, w: 1.9, h: 0.6,
        fontSize: 12, color: NAVY, bold: true, align: 'center'
      });
      slide.addText(s.desc, {
        x: x + 0.15, y: 4.1, w: 1.9, h: 2.1,
        fontSize: 10, color: GRAY, align: 'center', lineSpacing: 15
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 10: Admin Workflow
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Admin Workflow');
    addFooter(slide, 10);

    const adminSteps = [
      {
        num: '01',
        title: 'Authentication Guard',
        desc: 'Administrator signs in with verified admin credentials. Server validates role ADMIN; standard users are strictly denied.'
      },
      {
        num: '02',
        title: 'Facility Infrastructure Management',
        desc: 'Add new campus facilities (name, location, capacity, tariff). Automatically creates corresponding Lane A and B bays in MongoDB.'
      },
      {
        num: '03',
        title: 'Live Slot Status Override',
        desc: 'Manually toggle specific bays between Available and Occupied for maintenance, VIP arrivals, or emergency holds.'
      },
      {
        num: '04',
        title: 'Platform Bookings Ledger',
        desc: 'Search, filter, and review all campus reservations. Complete or release slots directly from the admin console.'
      }
    ];

    adminSteps.forEach((s, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 6.0;
      const y = 1.8 + row * 2.5;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 5.7, h: 2.2,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 1.0, h: 2.2,
        fill: { color: NAVY }
      });
      slide.addText(s.num, {
        x, y: y + 0.8, w: 1.0, h: 0.6,
        fontSize: 18, color: 'FFFFFF', bold: true, align: 'center'
      });
      slide.addText(s.title, {
        x: x + 1.2, y: y + 0.25, w: 4.3, h: 0.4,
        fontSize: 13, color: NAVY, bold: true
      });
      slide.addText(s.desc, {
        x: x + 1.2, y: y + 0.7, w: 4.3, h: 1.3,
        fontSize: 11, color: GRAY, lineSpacing: 16
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 11: Application Views & Live Layout
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Application Views & Live UI Modules');
    addFooter(slide, 11);

    const modules = [
      { name: '1. Landing Page', path: 'index.html', desc: 'Public branding, campus slot stats, search bar, and 3-step usage guide.' },
      { name: '2. Role-Based Login', path: 'login.html', desc: 'Secure JWT authentication with driver vs admin role routing and quick-test demo pills.' },
      { name: '3. User Dashboard', path: 'dashboard.html', desc: 'Live slot counters, browse & reserve lot catalog, and active passes table with cancellation.' },
      { name: '4. Visual Slot Grid', path: 'slot-selection.html', desc: '2D parking lane map with Green (Open), Red (Occupied), and Orange (Reserved) bays.' },
      { name: '5. Booking Confirmation', path: 'booking.html', desc: 'Schedule verification, automatic fee estimation, and printable digital pass generation.' },
      { name: '6. Admin Portal', path: 'admin.html', desc: 'Facility manager, bay status overrides, live platform occupancy metrics, and bookings log.' }
    ];

    modules.forEach((m, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 4.0;
      const y = 1.8 + row * 2.5;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 3.7, h: 2.2,
        fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 }
      });
      slide.addText(m.name, {
        x: x + 0.2, y: y + 0.2, w: 3.3, h: 0.35,
        fontSize: 12, color: NAVY, bold: true
      });
      slide.addText(`Route: /${m.path}`, {
        x: x + 0.2, y: y + 0.55, w: 3.3, h: 0.25,
        fontSize: 10, color: BLUE, bold: true
      });
      slide.addText(m.desc, {
        x: x + 0.2, y: y + 0.85, w: 3.3, h: 1.2,
        fontSize: 10, color: GRAY, lineSpacing: 15
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 12: Testing Results
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Verification & Testing Results (100% Passed)');
    addFooter(slide, 12);

    const testStats = [
      { label: 'REST API Test Assertions', value: '18 / 18 Passed', color: '16A34A' },
      { label: 'MongoDB Collections Active', value: '5 Collections', color: '0284C7' },
      { label: 'Role-Based Access Control', value: 'Strict HTTP 403', color: '2563EB' },
      { label: 'Browser Console Errors', value: '0 Console Errors', color: '16A34A' }
    ];

    testStats.forEach((t, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.6, w: 2.8, h: 1.3,
        fill: { color: 'FFFFFF' }, line: { color: t.color, width: 2 }
      });
      slide.addText(t.value, {
        x, y: 1.8, w: 2.8, h: 0.45,
        fontSize: 16, color: t.color, bold: true, align: 'center'
      });
      slide.addText(t.label, {
        x, y: 2.3, w: 2.8, h: 0.4,
        fontSize: 10, color: DARK, align: 'center'
      });
    });

    slide.addText('Summary of Verified Functional & Security Scenarios:', {
      x: 0.8, y: 3.2, w: 11.7, h: 0.35, fontSize: 13, color: NAVY, bold: true
    });

    const checks = [
      '✔ MongoDB Connection: Verified active connection to smart_parking_db on port 27017.',
      '✔ Duplicate Registration: Mongoose unique index successfully blocked duplicate email signups.',
      '✔ JWT Bearer Token: Verified token issuance and validation on protected APIs.',
      '✔ Conflict Prevention: Overlapping reservation attempts rejected with HTTP 409 Conflict.',
      '✔ Non-Overlapping Bookings: Subsequent bookings on the same bay for later hours succeeded.',
      '✔ Self-Service Cancellation: User booking cancellation frees slot and updates live lot counts.',
      '✔ Privilege Guard: Standard USER accounts blocked from administrative endpoints with HTTP 403.'
    ];

    checks.forEach((c, idx) => {
      slide.addText(c, {
        x: 0.8, y: 3.65 + idx * 0.45, w: 11.7, h: 0.35,
        fontSize: 11, color: DARK
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 13: Future Improvements
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'Future Roadmap & Enhancements');
    addFooter(slide, 13);

    const roadmap = [
      {
        phase: 'Phase 1: Hardware Integration',
        tech: 'IoT Ultrasonic Sensors & Arduino/ESP32',
        desc: 'Deploy physical ultrasonic sensors on each bay to automatically detect vehicle entry/exit and toggle MongoDB status in real-time.'
      },
      {
        phase: 'Phase 2: Automated Gate Access',
        tech: 'ANPR Camera Boom Barriers',
        desc: 'Automatic Number Plate Recognition (ANPR) cameras at campus boom barriers to scan registered vehicle plates and lift gates automatically.'
      },
      {
        phase: 'Phase 3: Digital Payments',
        tech: 'UPI & Payment Gateway',
        desc: 'Integration with Razorpay / UPI for cashless instantaneous parking fee settlement upon departure.'
      },
      {
        phase: 'Phase 4: Mobile Application',
        tech: 'React Native / Flutter Mobile App',
        desc: 'Native mobile client with turn-by-turn campus GPS navigation directly guiding drivers to their reserved parking bay.'
      }
    ];

    roadmap.forEach((r, idx) => {
      const y = 1.7 + idx * 1.25;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y, w: 11.7, h: 1.1,
        fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y, w: 3.2, h: 1.1,
        fill: { color: NAVY }
      });
      slide.addText(r.phase, {
        x: 0.9, y: y + 0.2, w: 3.0, h: 0.35,
        fontSize: 11, color: 'FFFFFF', bold: true
      });
      slide.addText(r.tech, {
        x: 0.9, y: y + 0.55, w: 3.0, h: 0.35,
        fontSize: 9, color: '93C5FD'
      });
      slide.addText(r.desc, {
        x: 4.3, y: y + 0.15, w: 7.9, h: 0.8,
        fontSize: 11, color: GRAY, lineSpacing: 16
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 14: Conclusion & Thank You
  // -------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    slide.addText('SR UNIVERSITY HACKATHON 2026', {
      x: 1.0, y: 1.8, w: 11, h: 0.4,
      fontSize: 14, color: '93C5FD', bold: true, letterSpacing: 2
    });
    slide.addText('Smart Parking Platform', {
      x: 1.0, y: 2.3, w: 11, h: 0.8,
      fontSize: 36, color: 'FFFFFF', bold: true
    });
    slide.addText('Successfully Built, Tested and Ready for Evaluation', {
      x: 1.0, y: 3.2, w: 11, h: 0.5,
      fontSize: 18, color: '38BDF8'
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 4.0, w: 11.3, h: 1.8,
      fill: { color: '172554' }, line: { color: BLUE, width: 1 }
    });

    slide.addText([
      { text: '• Verified End-to-End: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'All 8 user and administrative modules fully connected to MongoDB.\n', options: { color: 'E2E8F0' } },
      { text: '• Reliable & Conflict-Free: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'Zero double-booking, real-time availability sync, and verified RBAC security.\n', options: { color: 'E2E8F0' } },
      { text: '• Student-Engineered: ', options: { bold: true, color: 'FFFFFF' } },
      { text: 'Clean, modular, beginner-friendly codebase ready for faculty demonstration.\n', options: { color: 'E2E8F0' } }
    ], {
      x: 1.3, y: 4.2, w: 10.7, h: 1.4,
      fontSize: 12, lineSpacing: 20
    });

    slide.addText('Thank You! Questions & Live Demonstration Welcome.', {
      x: 1.0, y: 6.2, w: 11.3, h: 0.5,
      fontSize: 16, color: 'F8FAFC', bold: true, align: 'center'
    });
  }

  // Save Presentation
  const outputPath = path.join(__dirname, '..', 'submission', 'Smart_Parking_Platform_Presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log('✅ PowerPoint Presentation generated successfully at:', outputPath);
}

createPresentation().catch(console.error);
