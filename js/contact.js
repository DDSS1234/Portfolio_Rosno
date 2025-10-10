const contactToggles = Array.from(document.querySelectorAll('[data-contact-toggle]'));
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
let activeToggle = null;

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

function openContactDialog(trigger) {
  if (!contactDialog || contactDialog.classList.contains('is-visible')) return;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  activeToggle = trigger instanceof HTMLElement ? trigger : null;
  contactDialog.hidden = false;
  document.body.classList.add('is-modal-open');
  contactToggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'true'));

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
  contactToggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
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

  const fallbackToggle = activeToggle || contactToggles[0] || null;
  const focusTarget = lastFocusedElement && typeof lastFocusedElement.focus === 'function'
    ? lastFocusedElement
    : fallbackToggle;

  requestAnimationFrame(() => {
    focusTarget?.focus({ preventScroll: true });
    lastFocusedElement = null;
    activeToggle = null;
  });
}

function toggleContactDialog(trigger) {
  if (!contactDialog) return;
  if (contactDialog.hidden || !contactDialog.classList.contains('is-visible')) {
    openContactDialog(trigger);
  } else {
    closeContactDialog();
  }
}

if (contactToggles.length && contactDialog) {
  contactToggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      if (toggle.tagName === 'A') {
        event.preventDefault();
      }
      toggleContactDialog(toggle);
    });
  });
}

contactOverlay?.addEventListener('click', closeContactDialog);
contactClose?.addEventListener('click', closeContactDialog);
