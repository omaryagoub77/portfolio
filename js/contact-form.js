import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";

function logFirebaseError(context, error) {
  const details = error && typeof error === "object" ? error : {};
  console.error(context, {
    code: "code" in details ? details.code : "unknown",
    message: "message" in details ? details.message : String(error)
  }, error);
}

{
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');

  if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) {
    throw new Error('Contact form or status message is missing.');
  }

  const name = form.elements.namedItem('name');
  const email = form.elements.namedItem('email');
  const message = form.elements.namedItem('message');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!(name instanceof HTMLInputElement) || !(email instanceof HTMLInputElement) || !(message instanceof HTMLTextAreaElement) || !(submitButton instanceof HTMLButtonElement)) {
    throw new Error('Contact form fields are missing or have unexpected types.');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    status.dataset.state = '';
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    email.setCustomValidity(email.validity.typeMismatch ? 'Please enter a valid email address.' : '');
    message.setCustomValidity(message.value.trim().length >= 10 ? '' : 'Please enter at least 10 characters.');

    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    try {
      await addDoc(collection(db, 'contactMessages'), {
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
        createdAt: serverTimestamp()
      });
      form.reset();
      status.dataset.state = 'success';
      status.textContent = 'Your message has been sent. Thank you for reaching out.';
    } catch (error) {
      logFirebaseError('Could not send the contact message.', error);
      status.textContent = 'Your message could not be sent. Please try again in a moment.';
    } finally {
      submitButton.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}
