/* ===== State ===== */
let currentLang = localStorage.getItem('porriaiset-lang') || 'fi';
let datePicker = null;

/* ===== Language Switching ===== */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('porriaiset-lang', lang);
  document.documentElement.lang = lang;

  // Update toggle buttons
  document.getElementById('langFi').classList.toggle('active', lang === 'fi');
  document.getElementById('langEn').classList.toggle('active', lang === 'en');

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text !== undefined) {
      el.textContent = text;
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = getNestedValue(translations[lang], key);
    if (text !== undefined) {
      el.placeholder = text;
    }
  });

  // Re-render dynamic content
  renderMenu();
  renderReviews();
  updateDatePicker();
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/* ===== Menu Loading & Rendering ===== */
let menuData = null;

async function loadMenu() {
  try {
    // Fetch the live JSON file (on GitHub Pages this is the latest committed version)
    const response = await fetch('data/menu.json');
    menuData = await response.json();
    renderMenu();
  } catch (e) {
    document.getElementById('menuGrid').innerHTML =
      `<p class="menu-no-data">${translations[currentLang].menu.noMenu}</p>`;
  }
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const t = translations[currentLang].menu;

  if (!menuData || !menuData.days) {
    grid.innerHTML = `<p class="menu-no-data">${t.noMenu}</p>`;
    return;
  }

  // Update price
  document.getElementById('menuPrice').innerHTML = `${menuData.price} &euro;`;

  const isEn = currentLang === 'en';

  grid.innerHTML = menuData.days.map(day => {
    const dayName = t.days[day.day] || day.day;
    const mainText = isEn && day.mainEn ? day.mainEn : day.main;
    const soupText = isEn && day.soupEn ? day.soupEn : day.soup;
    const isThursday = day.day === 'thursday';

    let items = '';
    if (mainText) {
      items += `
        <div class="menu-item">
          <span class="menu-item-label">${t.mainCourse}</span>
          <span class="menu-item-name">${mainText}</span>
        </div>`;
    }
    if (soupText) {
      items += `
        <div class="menu-item">
          <span class="menu-item-label">${t.soup}</span>
          <span class="menu-item-name">${soupText}</span>
        </div>`;
    }

    return `
      <div class="menu-day${isThursday ? ' thursday-special' : ''}">
        <div class="menu-day-name">${dayName}</div>
        ${items}
      </div>`;
  }).join('');

  // Dessert line (if present in data)
  const dessertText = isEn && menuData.dessertEn ? menuData.dessertEn : menuData.dessert;
  if (dessertText) {
    grid.innerHTML += `
      <div class="menu-day" style="grid-column: 1 / -1; text-align: center; background: var(--color-gold-pale);">
        <div class="menu-day-name">${t.dessert}</div>
        <div class="menu-item">
          <span class="menu-item-name">${dessertText}</span>
        </div>
      </div>`;
  }

  // Updated date — format as d.m.yyyy
  if (menuData.lastUpdated) {
    const [y, m, d] = menuData.lastUpdated.split('-');
    const formatted = `${parseInt(d)}.${parseInt(m)}.${y}`;
    document.getElementById('menuUpdated').textContent =
      `${t.updated}: ${formatted}`;
  }
}

/* ===== Reviews Rendering ===== */
function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  const t = translations[currentLang].reviews;

  grid.innerHTML = t.reviewsList.map(review => {
    const initial = review.name.charAt(0).toUpperCase();
    const stars = '&#9733;'.repeat(review.stars);

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${initial}</div>
          <div class="review-meta">
            <h4>${review.name}</h4>
            <span class="review-source">${review.source}</span>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
        <p class="review-text">${review.text}</p>
      </div>`;
  }).join('');
}

/* ===== Mobile Navigation ===== */
function initMobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');

  function toggleNav() {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  function closeNav() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleNav);
  overlay.addEventListener('click', closeNav);

  // Close on nav link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });
}

/* ===== Scroll Effects ===== */
function initScrollEffects() {
  const nav = document.getElementById('siteNav');

  // Nav shadow on scroll
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Fade-in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ===== Cake Order Form ===== */
function initCakeForm() {
  const form = document.getElementById('cakeForm');
  const messageEl = document.getElementById('formMessage');

  // Dietary checkbox logic: "none" unchecks others, others uncheck "none"
  const dietaryContainer = document.getElementById('dietaryCheckboxes');
  const noneCheckbox = dietaryContainer.querySelector('[data-dietary-none]');
  const otherCheckboxes = dietaryContainer.querySelectorAll('input[name="dietary"]:not([data-dietary-none])');

  noneCheckbox.addEventListener('change', () => {
    if (noneCheckbox.checked) {
      otherCheckboxes.forEach(cb => cb.checked = false);
    }
  });

  otherCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        noneCheckbox.checked = false;
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const t = translations[currentLang].cakeOrder;

    // Honeypot check
    if (document.getElementById('cakeWebsite').value) return;

    // Basic validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Dietary validation: at least one must be checked
    const checkedDietary = dietaryContainer.querySelectorAll('input[name="dietary"]:checked');
    if (checkedDietary.length === 0) {
      dietaryContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dietaryContainer.style.outline = '2px solid #C62828';
      dietaryContainer.style.outlineOffset = '4px';
      dietaryContainer.style.borderRadius = '8px';
      setTimeout(() => {
        dietaryContainer.style.outline = '';
        dietaryContainer.style.outlineOffset = '';
      }, 3000);
      return;
    }

    // Gather form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Gather dietary selections (multiple checkboxes)
    const dietaryValues = [...checkedDietary].map(cb => {
      const labelSpan = cb.closest('.checkbox-label').querySelector('[data-i18n]');
      return labelSpan ? labelSpan.textContent : cb.value;
    });

    // Build email body
    const subject = encodeURIComponent(
      currentLang === 'fi'
        ? `Kakkutilaus: ${data.name}`
        : `Cake order: ${data.name}`
    );

    const body = encodeURIComponent(
      `${t.name}: ${data.name}\n` +
      `${t.phone}: ${data.phone}\n` +
      `${t.email}: ${data.email}\n` +
      `${t.date}: ${data.date}\n` +
      `${t.cakeType}: ${data.cakeType}\n` +
      `${t.people}: ${data.people || '-'}\n` +
      `${t.dietary}: ${dietaryValues.join(', ')}\n\n` +
      `${t.message}:\n${data.message || '-'}`
    );

    // For the concept demo, use mailto
    // In production, this would POST to an API endpoint
    const mailto = `mailto:tilaukset@porriaiset.fi?subject=${subject}&body=${body}`;

    // Try to open email client
    window.location.href = mailto;

    // Show success message
    messageEl.className = 'form-message success';
    messageEl.textContent = t.success;
    form.reset();
    if (datePicker) datePicker.clear();

    // Hide message after 8 seconds
    setTimeout(() => {
      messageEl.className = 'form-message';
      messageEl.textContent = '';
    }, 8000);
  });
}

/* ===== Cake Form Toggle ===== */
function toggleCakeForm() {
  const wrapper = document.getElementById('cakeFormWrapper');
  const btn = document.getElementById('cakeFormToggle');
  const t = translations[currentLang].cakeOrder;
  const isHidden = wrapper.style.display === 'none';

  wrapper.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? t.closeForm : t.openForm;

  if (isHidden) {
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Initialize date picker on first reveal
    if (!datePicker) initDatePicker();
  }
}

/* ===== Date Picker ===== */
function initDatePicker() {
  const t = translations[currentLang].cakeOrder;
  const now = new Date();
  const minYear = now.getFullYear();
  const maxYear = minYear + 2;
  const maxDate = new Date(maxYear, now.getMonth(), now.getDate());

  datePicker = flatpickr('#cakeDate', {
    dateFormat: 'd.m.Y',
    minDate: 'today',
    maxDate: maxDate,
    locale: currentLang === 'fi' ? 'fi' : 'default',
    placeholder: t.datePlaceholder,
    disableMobile: true,
    allowInput: false,
    onReady: function(selectedDates, dateStr, instance) {
      buildYearSelect(instance, minYear, maxYear);
    },
    onYearChange: function(selectedDates, dateStr, instance) {
      const sel = instance.calendarContainer.querySelector('.flatpickr-year-select');
      if (sel) sel.value = instance.currentYear;
    }
  });
}

function buildYearSelect(instance, minYear, maxYear) {
  const yearInput = instance.calendarContainer.querySelector('.cur-year');
  if (!yearInput) return;

  const select = document.createElement('select');
  select.className = 'flatpickr-year-select';
  select.setAttribute('aria-label', 'Year');

  for (let y = minYear; y <= maxYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === instance.currentYear) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', function() {
    instance.changeYear(parseInt(this.value));
  });

  yearInput.parentNode.replaceChild(select, yearInput);
  // Also hide the arrow buttons since the select handles navigation
  const arrows = instance.calendarContainer.querySelectorAll('.arrowUp, .arrowDown');
  arrows.forEach(a => a.style.display = 'none');
}

function updateDatePicker() {
  if (!datePicker) return;
  const t = translations[currentLang].cakeOrder;
  datePicker.set('locale', currentLang === 'fi' ? 'fi' : 'default');
  datePicker.input.placeholder = t.datePlaceholder;
}

/* ===== Footer Year ===== */
function updateFooterYear() {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
}

/* ===== Initialize ===== */
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  loadMenu();
  initMobileNav();
  initScrollEffects();
  initCakeForm();
  updateFooterYear();
});
