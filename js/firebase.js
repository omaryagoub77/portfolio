import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIo3jxaMDe8FZ12qQHVKkoeS9JTM0Yxvg",
  authDomain: "money-box-dcc11.firebaseapp.com",
  projectId: "money-box-dcc11",
  storageBucket: "money-box-dcc11.firebasestorage.app",
  messagingSenderId: "350529130801",
  appId: "1:350529130801:web:7788f377c0d2cf1ce62010",
  measurementId: "G-XDGKKSV7GQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
