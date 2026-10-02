(() => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');

  if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;

  const name = form.elements.namedItem('name');
  const email = form.elements.namedItem('email');
  const message = form.elements.namedItem('message');

  if (!(name instanceof HTMLInputElement) || !(email instanceof HTMLInputElement) || !(message instanceof HTMLTextAreaElement)) {
    throw new Error('Contact form fields are missing or have unexpected types.');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = '';
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    email.setCustomValidity(email.validity.typeMismatch ? 'Please enter a valid email address.' : '');
    message.setCustomValidity(message.value.trim().length >= 10 ? '' : 'Please enter at least 10 characters.');

    if (!form.reportValidity()) return;

    const subject = encodeURIComponent(`Portfolio inquiry from ${name.value.trim()}`);
    const body = encodeURIComponent(`From: ${name.value.trim()} (${email.value.trim()})\n\n${message.value.trim()}`);
    status.textContent = 'Your email app will open with the message ready to send.';
    window.location.href = `mailto:omaryagoub77@gmail.com?subject=${subject}&body=${body}`;
  });
})();
