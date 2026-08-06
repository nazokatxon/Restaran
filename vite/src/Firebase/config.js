// firebase.js fayli ichida
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Veb-ilovangizning Firebase konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyCG_2OrLoKRVCo67huOQgW4cHxZ6Kt0pXM",
  authDomain: "restourant-e6cce.firebaseapp.com",
  projectId: "restorant-e6cce",
  storageBucket: "restourant-e6cce.firebasestorage.app",
  messagingSenderId: "812324770813",
  appId: "1:812324770813:web:edb6b19dc3c4eba73e3f94",
  measurementId: "G-5TNRN204JG"
};

// Firebase’ni ishga tushirish
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Boshqa fayllarda (masalan, main.js yoki app.js) ishlatish uchun eksport qilamiz
export { app };