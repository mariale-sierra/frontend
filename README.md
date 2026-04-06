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
git clone <YOUR_REPO_URL>
cd <PROJECT_FOLDER_NAME>
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
