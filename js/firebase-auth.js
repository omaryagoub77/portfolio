import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIo3jxaMDe8FZ12qQHVKkoeS9JTM0Yxvg",
  authDomain: "money-box-dcc11.firebaseapp.com",
  projectId: "money-box-dcc11",
  storageBucket: "money-box-dcc11.firebasestorage.app",
  messagingSenderId: "350529130801",
  appId: "1:350529130801:web:7788f377c0d2cf1ce62010",
  measurementId: "G-XDGKKSV7GQ"
};

const auth = getAuth(initializeApp(firebaseConfig));
const form = document.querySelector("#signin-form, #signup-form");
const message = document.querySelector("#auth-message");
const loginLink = document.querySelector('.header-actions a[href="signin.html"]');

if (loginLink instanceof HTMLAnchorElement) {
  onAuthStateChanged(auth, (user) => {
    loginLink.hidden = Boolean(user);
  });
}

if (form) {
  if (!(message instanceof HTMLElement)) {
    throw new Error("The authentication status message element is missing.");
  }

  const emailInput = form.elements.namedItem("email");
  const passwordInput = form.elements.namedItem("password");
  const submitButton = form.querySelector('button[type="submit"]');
  const isSignUp = form.id === "signup-form";

  function showMessage(text, state = "error") {
    message.textContent = text;
    message.dataset.state = state;
    message.hidden = false;
  }

  function redirectHome() {
    window.setTimeout(() => window.location.replace("index.html"), 800);
  }

  function getAuthErrorMessage(error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    const messages = {
      "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
      "auth/invalid-credential": "The email or password is incorrect. Please try again.",
      "auth/invalid-login-credentials": "The email or password is incorrect. Please try again.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/missing-email": "Enter your email address first.",
      "auth/operation-not-allowed": "Email and password sign-in is not enabled for this Firebase project.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/user-disabled": "This account has been disabled. Contact the site owner for help.",
      "auth/user-not-found": "Could not send a reset email. Check the address and try again.",
      "auth/weak-password": "Choose a stronger password with at least 8 characters.",
      "auth/network-request-failed": "Could not connect. Check your internet connection and try again."
    };

    return messages[code] || "Authentication failed. Please try again.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.hidden = true;
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");

    try {
      if (isSignUp) {
        const name = form.elements.namedItem("name").value.trim();
        const credential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);

        try {
          await updateProfile(credential.user, { displayName: name });
        } catch {
          showMessage("Your account was created, but we could not save your name. You can update it later.", "warning");
          form.reset();
          redirectHome();
          return;
        }

        showMessage("Your account was created successfully. Taking you home...", "success");
        form.reset();
        redirectHome();
        return;
      }

      const rememberMe = form.elements.namedItem("remember").checked;
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      showMessage("You are signed in successfully. Taking you home...", "success");
      form.reset();
      redirectHome();
    } catch (error) {
      showMessage(getAuthErrorMessage(error));
    } finally {
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });

  const resetButton = document.querySelector("#reset-password");
  if (resetButton) {
    resetButton.addEventListener("click", async () => {
      message.hidden = true;
      if (!emailInput.reportValidity()) return;

      resetButton.disabled = true;
      try {
        await sendPasswordResetEmail(auth, emailInput.value.trim());
        showMessage("If an account exists for that email, a password reset link has been sent.", "success");
      } catch (error) {
        showMessage(getAuthErrorMessage(error));
      } finally {
        resetButton.disabled = false;
      }
    });
  }
}
