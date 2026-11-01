'use strict';

// Class records and validation rules keep content separate from behavior.
const classes = [
  { id: 'gentle', title: 'Gentle Yoga', description: 'Slow stretches with optional chair support. A welcoming introduction for beginners.' },
  { id: 'vinyasa', title: 'Vinyasa Yoga', description: 'Link breath and movement in a flowing practice. Ask about pace and modifications.' },
  { id: 'restorative', title: 'Restorative Yoga', description: 'Supported resting poses and props offer time to unwind.' }
];
const rules = [
  { id: 'name', check: value => value.length >= 2 && value.length <= 80, message: 'Enter a name between 2 and 80 characters.' },
  { id: 'email', check: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120, message: 'Enter a valid email, such as name@example.com.' },
  { id: 'interest', check: value => Boolean(value), message: 'Choose a class or event.' },
  { id: 'experience', check: value => Boolean(value), message: 'Choose your experience level.' }
];
const storageKey = 'riverbend.classPreference.v1';

function loadPreference() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return classes.some(item => item.id === value?.classId) ? value : null;
  } catch (error) {
    return null; // Malformed or unavailable storage must not break the page.
  }
}

function renderRecommendation(id) {
  const container = document.getElementById('recommendation');
  container.replaceChildren();
  const selected = classes.find(item => item.id === id);
  if (!selected) return;
  const heading = document.createElement('h3');
  const description = document.createElement('p');
  heading.textContent = selected.title;
  description.textContent = selected.description;
  container.append(heading, description);
}

function setupSelector() {
  const selector = document.getElementById('preference');
  if (!selector) return;
  const status = document.getElementById('storage-status');
  const saved = loadPreference();
  if (saved) {
    selector.value = saved.classId;
    renderRecommendation(saved.classId);
    status.textContent = 'Your saved preference was restored from this browser.';
  }
  selector.addEventListener('change', () => {
    renderRecommendation(selector.value);
    try {
      if (selector.value) {
        localStorage.setItem(storageKey, JSON.stringify({ classId: selector.value }));
        status.textContent = 'Preference saved in this browser. It will also fill your class interest on Events.';
      } else {
        localStorage.removeItem(storageKey);
        status.textContent = 'Choose a goal to save a preference.';
      }
    } catch (error) {
      status.textContent = 'Recommendations work, but this browser could not save your preference.';
    }
  });
  document.getElementById('clear-preference').addEventListener('click', () => {
    try {
      localStorage.removeItem(storageKey);
      selector.value = '';
      renderRecommendation('');
      status.textContent = 'Your saved preference has been removed.';
    } catch (error) {
      status.textContent = 'This browser could not remove the saved preference.';
    }
  });
}

function showError(field, message) {
  let feedback = document.getElementById(`${field.id}-error`);
  if (!feedback) {
    feedback = document.createElement('span');
    feedback.id = `${field.id}-error`;
    feedback.className = 'field-error';
    field.parentElement.append(feedback);
    const describedBy = field.getAttribute('aria-describedby') || '';
    field.setAttribute('aria-describedby', `${describedBy} ${feedback.id}`.trim());
  }
  feedback.textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
}

function validateForm(form) {
  let firstInvalid = null;
  rules.forEach(rule => {
    const field = form.elements.namedItem(rule.id);
    const message = rule.check(field.value.trim()) ? '' : rule.message;
    showError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });
  const emailContact = document.getElementById('by-email');
  const phoneContact = document.getElementById('by-phone');
  const contactError = !emailContact.checked && !phoneContact.checked;
  showError(emailContact, contactError ? 'Choose email or phone contact.' : '');
  showError(phoneContact, '');
  if (contactError && !firstInvalid) firstInvalid = emailContact;
  const phone = document.getElementById('phone');
  const phoneValid = !phoneContact.checked || /^[+\d\s().-]{7,30}$/.test(phone.value.trim()) && phone.value.replace(/\D/g, '').length >= 7;
  showError(phone, phoneValid ? '' : 'Enter a phone number with at least 7 digits for phone contact.');
  if (!phoneValid && !firstInvalid) firstInvalid = phone;
  const message = document.getElementById('message');
  showError(message, message.value.length <= 1000 ? '' : 'Keep your message within 1,000 characters.');
  if (message.value.length > 1000 && !firstInvalid) firstInvalid = message;
  return firstInvalid;
}

function setupForm() {
  const form = document.getElementById('request-form');
  if (!form) return;
  // Native HTML validation remains the fallback when JavaScript is disabled.
  form.noValidate = true;
  const saved = loadPreference();
  if (saved) {
    form.elements.interest.value = saved.classId;
    document.getElementById('restored-interest').textContent = 'Your saved class preference filled the class interest field. You can change it below.';
  }
  let attempted = false;
  const status = document.getElementById('form-status');
  form.addEventListener('submit', event => {
    event.preventDefault(); // This assignment has no server for real requests.
    attempted = true;
    const invalid = validateForm(form);
    status.textContent = invalid ? 'Please correct the highlighted fields. Your entries have been kept.' : 'Your information passed validation. This is a classroom demo; no request was sent or reservation made.';
    if (invalid) invalid.focus();
  });
  form.addEventListener('input', () => {
    if (attempted) {
      validateForm(form);
      status.textContent = 'Your entries have been kept. Select the check button when ready.';
    }
  });
  form.addEventListener('change', () => { if (attempted) validateForm(form); });
}

setupSelector();
setupForm();
