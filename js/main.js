// Initialize Lucide icons
lucide.createIcons();

// ---- Booking slot interaction ----
document.querySelectorAll('.booking-slot').forEach(function(slot) {
  slot.addEventListener('click', function() {
    document.querySelectorAll('.booking-slot').forEach(function(s) {
      s.classList.remove('booking-slot--selected');
      s.setAttribute('aria-selected', 'false');
    });
    slot.classList.add('booking-slot--selected');
    slot.setAttribute('aria-selected', 'true');
  });
});

// ---- Google Sheets submission ----
async function submitToGoogleSheets(formData) {
  // Google Apps Script deployment URL
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8VuGJV5GiUb-kVISEhRBvqMTgPYkIvMntXdQnyXvVRTX67qxMco1D5zkK6uAoGjZI/exec';

  var payload = {
    timestamp: new Date().toISOString(),
    name: formData.name,
    email: formData.email,
    discipline: formData.discipline,
    city: formData.city
  };

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error('Submission error:', error);
    return false;
  }
}

// ---- Form validation ----
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldId, errorId, show) {
  var field = document.getElementById(fieldId);
  var error = document.getElementById(errorId);
  if (show) {
    field.classList.add('error');
    error.classList.add('visible');
  } else {
    field.classList.remove('error');
    error.classList.remove('visible');
  }
}

// ---- Form submission ----
document.getElementById('waitlistForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  var nameVal       = document.getElementById('field-name').value.trim();
  var emailVal      = document.getElementById('field-email').value.trim();
  var disciplineVal = document.getElementById('field-discipline').value;
  var cityVal       = document.getElementById('field-city').value.trim();

  var hasError = false;

  setFieldError('field-name', 'error-name', !nameVal);
  if (!nameVal) hasError = true;

  setFieldError('field-email', 'error-email', !emailVal || !validateEmail(emailVal));
  if (!emailVal || !validateEmail(emailVal)) hasError = true;

  setFieldError('field-discipline', 'error-discipline', !disciplineVal);
  if (!disciplineVal) hasError = true;

  setFieldError('field-city', 'error-city', !cityVal);
  if (!cityVal) hasError = true;

  if (hasError) return;

  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  await submitToGoogleSheets({
    name: nameVal,
    email: emailVal,
    discipline: disciplineVal,
    city: cityVal
  });

  // Show success state regardless of fetch outcome
  // (no-cors means we can't read the response)
  document.getElementById('waitlistForm').style.display = 'none';
  document.getElementById('waitlistSuccess').classList.add('visible');
});

// Clear errors on input/change
['field-name', 'field-email', 'field-discipline', 'field-city'].forEach(function(id) {
  var el = document.getElementById(id);
  var errorId = 'error-' + id.replace('field-', '');
  el.addEventListener('input', function() {
    el.classList.remove('error');
    document.getElementById(errorId).classList.remove('visible');
  });
  el.addEventListener('change', function() {
    el.classList.remove('error');
    document.getElementById(errorId).classList.remove('visible');
  });
});
