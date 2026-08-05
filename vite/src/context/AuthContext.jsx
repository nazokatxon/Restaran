import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { toast } from "react-toastify";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { auth, db, secondaryAuth } from "../firebase/config.js";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cafeId, setCafeId] = useState(null);
  const [cafeName, setCafeName] = useState(""); // Kafe nomi uchun state
  const [loading, setLoading] = useState(true);
  const audioCtxRef = useRef(null);

  // Kafe ma'lumotlarini Firestore'dan olish
  const fetchCafeData = async (currentCafeId) => {
    if (!currentCafeId) {
      setCafeName("");
      return;
    }
    try {
      const cafeDocRef = doc(db, "cafes", currentCafeId);
      const cafeDocSnap = await getDoc(cafeDocRef);
      if (cafeDocSnap.exists()) {
        const cData = cafeDocSnap.data();
        setCafeName(cData.name || cData.title || "Kafe");
      } else {
        setCafeName("");
      }
    } catch (error) {
      console.error("Kafe ma'lumotlarini olishda xatolik:", error);
      setCafeName("");
    }
  };

  // Foydalanuvchi ma'lumotlarini Firestore'dan olish
  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setRole(data.role || null);
        setCafeId(data.cafeId || null);
        
        // Kafe nomini yuklash
        if (data.cafeId) {
          await fetchCafeData(data.cafeId);
        }

        return data;
      } else {
        setRole(null);
        setCafeId(null);
        setCafeName("");
        return null;
      }
    } catch (error) {
      console.error("Foydalanuvchi ma'lumotlarini olishda xatolik:", error);
      setRole(null);
      setCafeId(null);
      setCafeName("");
      return null;
    }
  };

  // Ro'yxatdan o'tish
  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  };

  // XODIM YARATISH (Admin yoki Manager uchun)
  const registerStaff = async (email, password, extraData = {}) => {
    if (!secondaryAuth) {
      console.error("secondaryAuth Firebase config faylida topilmadi!");
      throw new Error("Firebase secondaryAuth sozlanmagan.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        email,
        fullName: extraData.fullName || "",
        role: extraData.role || "waiter",
        cafeId: extraData.cafeId || cafeId,
        phone: extraData.phone || "",
        status: extraData.status || "active",
        createdAt: serverTimestamp(),
      });

      await signOut(secondaryAuth);
      return newUser;
    } catch (error) {
      console.error("Xodim yaratishda xatolik:", error);
      throw error;
    }
  };

  // Kirish funksiyasi
  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const data = await fetchUserData(userCredential.user.uid);
      setLoading(false);
      return data?.role || null;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Chiqish
  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setRole(null);
    setCafeId(null);
    setCafeName("");
    setLoading(false);
  };

  // Bildirishnoma ovozi
  const playOrderReadySound = async () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();

      const now = ctx.currentTime;
      const tone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.18, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration);
      };

      tone(520, 0, 0.18);
      tone(700, 0.18, 0.16);
      tone(880, 0.34, 0.2);
    } catch (error) {
      console.error("Order ready audio error:", error);
    }
  };

  // Ekran bosilganda audio kontekstni tayyorlash
  useEffect(() => {
    const unlockAudio = async () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Global xabarnoma: FAQAT OFITSIANT ning O'ZI YUBORGAN va tayyor bo'lgan buyurtmalarga xabar va ovoz beradi
  useEffect(() => {
    if (!user || !cafeId || role !== "waiter") return;

    const q = query(
      collection(db, "orders"),
      where("cafeId", "==", cafeId),
      where("waiterId", "==", user.uid),
      where("kitchenStatus", "==", "ready")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added" && change.type !== "modified") return;
        
        const orderData = { id: change.doc.id, ...change.doc.data() };
        
        if (orderData.waiterNotified) return;

        toast.info(`🛎 Stol №${orderData.tableNumber || "-"} uchun buyurtma tayyor!`, {
          position: "top-right",
          style: { backgroundColor: "#8B4513", color: "#ffffff" },
          icon: "🍽",
        });

        playOrderReadySound();

        updateDoc(doc(db, "orders", orderData.id), {
          waiterNotified: true,
        }).catch((err) => {
          console.error("waiterNotified update error:", err);
        });
      });
    });

    return () => unsubscribe();
  }, [user, cafeId, role]);

  // Auth holatini eshitib turish
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        setRole(null);
        setCafeId(null);
        setCafeName("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    role,
    cafeId,
    cafeName, // Endi butun ilova bo'ylab cafeName ishlatish mumkin
    loading,
    login,
    register,
    registerStaff,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}