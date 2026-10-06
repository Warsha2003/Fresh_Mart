# FreshMart Grocery App

Local grocery delivery and management platform with Expo React Native mobile frontend and Node/Express + MongoDB Atlas backend.

---

## Network & Physical Device Setup (Expo Go)

When testing on a physical iPhone or Android device via Expo Go:

### Option A: Local Wi-Fi (Recommended)

1. **Fix Windows Firewall**:
   Windows Defender by default has an explicit block rule for Node.js on Private Wi-Fi profiles.
   - Right-click `fix-firewall.bat` in the project root and select **"Run as administrator"**.
   - Or run this in an Administrator PowerShell / Command Prompt:
     ```cmd
     netsh advfirewall firewall delete rule name="Node.js JavaScript Runtime"
     netsh advfirewall firewall add rule name="Node.js JavaScript Runtime" dir=in action=allow program="C:\Program Files\nodejs\node.exe" profile=any
     netsh advfirewall firewall add rule name="Backend 5000" dir=in action=allow protocol=TCP localport=5000 profile=any
     ```

2. **Make sure your phone is on the SAME Wi-Fi**:
   - Both your laptop and your phone must be connected to the same Wi-Fi router (e.g. `Dialog 4G`).
   - If your phone is on Mobile Data (4G/LTE), turn on Wi-Fi and connect to your Wi-Fi network.

3. **Check your Wi-Fi IP**:
   - In `backend/`, run `npm run ip`
   - Ensure `frontend/.env` has:
     ```env
     EXPO_PUBLIC_API_URL=http://<YOUR_WIFI_IP>:5000/api
     ```

### Option B: Cloud Tunnel (Works on Mobile Data too!)

If your router isolates devices (AP Isolation) or your phone is on Mobile Data:
1. In `backend/`, run:
   ```bash
   npm run tunnel
   ```
2. Copy the generated `https://xxxx.loca.lt` URL and update `frontend/.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://xxxx.loca.lt/api
   ```
3. Restart Expo:
   ```bash
   npx expo start --clear --tunnel
   ```

---

## Starting the Project

### Backend
```bash
cd backend
npm install
npm run dev   # or npm start
```
- Health check: `http://localhost:5000/api/health`

### Frontend
```bash
cd frontend
npm install
npx expo start --clear --tunnel
```
