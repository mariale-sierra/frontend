# 🚀 Getting Started

This project is built using **React Native + Expo + Expo Router**.

Follow these steps to run the app locally.

---

## 📦 1. Install Requirements

Make sure you have:

### ✅ Node.js

Download and install:
https://nodejs.org/

Verify installation:

```bash
node -v
npm -v
```

---

## 📱 2. Install Expo CLI

Run:

```bash
npm install -g expo-cli
```

---

## 📥 3. Clone the Repository

```bash
git clone https://github.com/mariale-sierra/frontend.git
cd frontend
```

---

## 📦 4. Install Dependencies

Run:

```bash
npm install --legacy-peer-deps
```

> We use `--legacy-peer-deps` to avoid dependency conflicts.

---

## 📦 4.1 Install Expo-specific Dependencies (if missing)

If the project does not start correctly or dependencies are missing, install them using:

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-linear-gradient -- --legacy-peer-deps
```

These are required for:

* Navigation (Expo Router)
* Safe areas
* Screens optimization
* Linking
* Status bar
* Gradients

---

## ▶️ 5. Start the App

```bash
npx expo start
```

---

## 📱 6. Run the App

After starting:

* Press **"i"** → open iOS simulator (Mac only)
* Press **"a"** → open Android emulator
* Or scan the QR code using **Expo Go app** on your phone

Download Expo Go:

* iOS: https://apps.apple.com/app/expo-go/id982107779
* Android: https://play.google.com/store/apps/details?id=host.exp.exponent

---

## Running against a local backend

By default the app talks to the shared Azure server (`EXPO_PUBLIC_API_URL` in `.env`). To point it at a backend running on your own machine instead (see `raiz/README.md` for `npm run dev:local`):

```bash
npm run start:local
```

This detects your machine's LAN IPv4 address and writes it to `.env.local` as `EXPO_PUBLIC_API_URL=http://<your-ip>:3000` (gitignored, per-machine only — `.env` and the Azure URL are untouched), then runs `expo start`. Your phone must be on the **same WiFi network** as the machine running the backend, and able to reach it on port 3000 (check the OS firewall if the connection times out). Rerun `npm run start:local` any time your IP changes (new WiFi network, etc.) — it detects the IP fresh every time.

If the wrong IP gets picked (e.g. a VPN adapter), edit `EXPO_PUBLIC_API_URL` in `.env.local` by hand.

---

## 🧹 If Something Breaks

Try:

```bash
npx expo start -c
```

This clears cache.

---

## 🛠 Notes

* Do NOT use `npm install` without `--legacy-peer-deps`
* Do NOT modify dependency versions unless necessary
* This project uses **Expo Router**, so all screens live inside the `/app` folder

---

You're ready to go 🚀
