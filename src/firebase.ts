import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// === Firebase konfigurace ===
const firebaseConfig = {
    apiKey: "AIzaSyATOd1zv1yjTgZuxoj1hIJq4v2fjsbcMZ8",
    authDomain: "coalios-napoveda.firebaseapp.com",
    databaseURL: "https://coalios-napoveda-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "coalios-napoveda",
    storageBucket: "coalios-napoveda.firebasestorage.app",
    messagingSenderId: "592933271316",
    appId: "1:592933271316:web:8c0c64155aa20f8955b401",
    measurementId: "G-X8M20GY8MG"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);  

export const storage = getStorage(app);
export { db };