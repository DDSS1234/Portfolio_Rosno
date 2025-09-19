const catalog = document.getElementById('catalog');
const indicatorPortal = document.querySelector('[data-catalog-indicators]');
let indicatorContainer = indicatorPortal || null;
let indicatorButtons = [];
let scrollAnimationFrame = null;
let listenersAttached = false;
const contactToggle = document.querySelector('[data-contact-toggle]');
const contactDialog = document.querySelector('[data-contact-dialog]');
const contactOverlay = contactDialog?.querySelector('[data-contact-overlay]') || null;
const contactClose = contactDialog?.querySelector('[data-contact-close]') || null;
const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');
let lastFocusedElement = null;

function createCard(project) {
  const type = Array.isArray(project.tags) && project.tags.length
    ? project.tags[0]
    : 'product';
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `projects/${project.id}.html`;
  card.innerHTML = `
    <div class="tag ${type}">
      <img src="icons/${type}.svg" alt="${type} icon">
    </div>
    <div class="thumb"><img src="${project.thumb}" alt="${project.title}"></div>
    <div class="info">
      <h3>${project.title}</h3>
    </div>
  `;
  return card;
}

function renderProjects(projects) {
  if (!catalog) return;
  const fragment = document.createDocumentFragment();
  projects.forEach(project => fragment.appendChild(createCard(project)));
  catalog.appendChild(fragment);
  setupCatalogIndicators();
}

function setupCatalogIndicators() {
  if (!catalog) return;
  const cards = Array.from(catalog.querySelectorAll('.card'));
  if (!cards.length) return;

  if (!indicatorContainer) {
    indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'catalog-indicators';
    if (indicatorPortal) {
      indicatorPortal.appendChild(indicatorContainer);
    } else {
      catalog.insertAdjacentElement('afterend', indicatorContainer);
    }
  } else if (indicatorPortal && indicatorContainer !== indicatorPortal && indicatorContainer.parentElement !== indicatorPortal) {
    indicatorPortal.appendChild(indicatorContainer);
  }

  indicatorContainer.innerHTML = '';
  indicatorButtons = cards.map((card, index) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.className = 'catalog-indicator';
    indicator.dataset.index = String(index);
    const titleElement = card.querySelector('h3');
    const projectTitle = titleElement ? titleElement.textContent.trim() : '';
    const accessibleLabel = `Slide ${index + 1} of ${cards.length}${projectTitle ? ` — ${projectTitle}` : ''}`;
    indicator.setAttribute('aria-label', accessibleLabel);
    indicator.title = projectTitle || `Slide ${index + 1}`;
    indicator.addEventListener('click', () => {
      card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    indicatorContainer.appendChild(indicator);
    return indicator;
  });

  if (!listenersAttached) {
    catalog.addEventListener('scroll', handleCatalogScroll, { passive: true });
    window.addEventListener('resize', updateCatalogIndicators);
    listenersAttached = true;
  }

  updateCatalogIndicators();
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(focusableSelector)).filter(element => {
    return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
  });
}

function handleDialogKeydown(event) {
  if (!contactDialog || contactDialog.hidden) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeContactDialog();
    return;
  }

  if (event.key === 'Tab') {
    const focusable = getFocusableElements(contactDialog);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const isShiftPressed = event.shiftKey;
    const activeElement = document.activeElement;

    if (!isShiftPressed && activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    } else if (isShiftPressed && activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
  }
}

function openContactDialog() {
  if (!contactDialog || contactDialog.classList.contains('is-visible')) return;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  contactDialog.hidden = false;
  document.body.classList.add('is-modal-open');
  contactToggle?.setAttribute('aria-expanded', 'true');

  requestAnimationFrame(() => {
    contactDialog.classList.add('is-visible');
    const focusable = getFocusableElements(contactDialog);
    const first = focusable[0] || contactDialog;
    if (first instanceof HTMLElement) {
      first.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', handleDialogKeydown);
}

function closeContactDialog() {
  if (!contactDialog || contactDialog.hidden) return;
  contactDialog.classList.remove('is-visible');
  document.body.classList.remove('is-modal-open');
  contactToggle?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', handleDialogKeydown);

  let fallbackTimeout;

  const handleTransitionEnd = (event) => {
    if (event.target !== contactDialog) return;
    contactDialog.hidden = true;
    contactDialog.removeEventListener('transitionend', handleTransitionEnd);
    window.clearTimeout(fallbackTimeout);
  };

  fallbackTimeout = window.setTimeout(() => {
    contactDialog.hidden = true;
    contactDialog.removeEventListener('transitionend', handleTransitionEnd);
  }, 260);

  contactDialog.addEventListener('transitionend', handleTransitionEnd);

  const focusTarget = lastFocusedElement && typeof lastFocusedElement.focus === 'function'
    ? lastFocusedElement
    : contactToggle;

  requestAnimationFrame(() => {
    focusTarget?.focus({ preventScroll: true });
    lastFocusedElement = null;
  });
}

function toggleContactDialog() {
  if (!contactDialog) return;
  if (contactDialog.hidden || !contactDialog.classList.contains('is-visible')) {
    openContactDialog();
  } else {
    closeContactDialog();
  }
}

function handleCatalogScroll() {
  if (scrollAnimationFrame !== null) return;
  scrollAnimationFrame = window.requestAnimationFrame(() => {
    scrollAnimationFrame = null;
    updateCatalogIndicators();
  });
}

function updateCatalogIndicators() {
  if (!catalog || !indicatorButtons.length) return;
  const maxScroll = catalog.scrollWidth - catalog.clientWidth;
  const progress = maxScroll > 0 ? catalog.scrollLeft / maxScroll : 0;
  const activeIndex = Math.round(progress * (indicatorButtons.length - 1));

  indicatorButtons.forEach((button, index) => {
    const isActive = index === activeIndex;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

fetch('data/projects.json')
  .then(response => response.json())
  .then(data => renderProjects(data))
  .catch(error => {
    console.error('Failed to load projects', error);
  });

if (contactToggle && contactDialog) {
  contactToggle.addEventListener('click', toggleContactDialog);
}

contactOverlay?.addEventListener('click', closeContactDialog);
contactClose?.addEventListener('click', closeContactDialog);
