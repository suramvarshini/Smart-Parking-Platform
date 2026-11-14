# Smart Parking Platform (SPP) - Submission Package
## SR University Web Technologies & Mobile Programming Hackathon 2026

Welcome to the official submission package for **Smart Parking Platform (SPP)**.

### 📦 Submission Contents

| File | Description |
|---|---|
| **`Smart_Parking_Platform_Presentation.pptx`** | Professional 14-slide widescreen PowerPoint presentation. |
| **`Smart-Parking-Platform-Source-Code.zip`** | Complete, clean source code archive (excludes `node_modules` and `.env`). |
| **`Smart_Parking_Platform_Demo.mp4`** | High-definition demonstration video asset. |
| **`DEMO_RECORDING_PLAN.md`** | 5-minute timed demonstration script, scene narration cues, and click paths. |
| **`SLIDES.md`** | Complete markdown transcript and layout of all 14 presentation slides. |
| **`screenshots/`** | High-resolution captures of the live working application. |

---

### 🚀 How to Run the Project from Source Code

1. Extract `Smart-Parking-Platform-Source-Code.zip` into a clean directory.
2. In terminal, run:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
4. Seed MongoDB database (`smart_parking_db` on port 27017):
   ```bash
   node scripts/seed.js
   ```
5. Start the full-stack server:
   ```bash
   npm start
   ```
6. Open your browser at:
   👉 **`http://localhost:5000`**

---

### 🔑 Test Accounts & Demo Credentials

- **Driver / Student**: `user@sru.edu.in` / `user123`
- **Campus Administrator**: `admin@sru.edu.in` / `admin123`

---

### 🧪 Run Automated Verification Test Suite

To run the full 18-assertion test harness:
```bash
node scripts/test_thunder_client.js
```
Expected output: **18/18 TESTS PASSED SUCCESSFULLY!**
