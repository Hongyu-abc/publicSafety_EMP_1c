import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHdU2u0MYzWEVQ7CW_nxD2qtppZxsYixk",
  authDomain: "publicsafety-44e1b.firebaseapp.com",
  projectId: "publicsafety-44e1b",
  storageBucket: "publicsafety-44e1b.firebasestorage.app",
  messagingSenderId: "623824719842",
  appId: "1:623824719842:web:73dbc0767af52f22f0b3bb",
  measurementId: "G-MX3VMRWLH0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const analytics = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
);
const functions = getFunctions(app, "us-central1");

export { app, analytics, functions };
