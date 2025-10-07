const catalog = document.getElementById('catalog');
const indicatorPortal = document.querySelector('[data-catalog-indicators]');
let indicatorContainer = indicatorPortal || null;
let indicatorButtons = [];
let scrollAnimationFrame = null;
let listenersAttached = false;
let wheelListenerAttached = false;
let keyListenerAttached = false;
const categoryLabels = {
  architecture: 'Architecture',
  product: 'Product',
  material: 'Material',
  'ui/ux': 'UI/UX',
  'uiux': 'UI/UX',
  'ui-ux': 'UI/UX',
  art: 'Art'
};

function getCategoryLabel(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return 'Product';
  }

  const normalizedType = type.trim().toLowerCase();
  if (categoryLabels[normalizedType]) {
    return categoryLabels[normalizedType];
  }

  return type
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createCard(project) {
  const type = Array.isArray(project.tags) && project.tags.length
    ? project.tags[0]
    : 'product';
  const categoryLabel = getCategoryLabel(type);
  const card = document.createElement('a');
  card.className = 'card';
  const thumbAspect = project.thumbAspect;

  if (typeof thumbAspect === 'string') {
    const normalizedAspect = thumbAspect.trim().toLowerCase();

    if (normalizedAspect === 'square' || normalizedAspect === '1:1' || normalizedAspect === '1/1') {
      card.classList.add('card--square');
    } else if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(normalizedAspect)) {
      card.style.setProperty('--card-thumb-aspect', normalizedAspect.replace(/\s+/g, ''));
    } else {
      const numericAspect = Number.parseFloat(normalizedAspect);
      if (Number.isFinite(numericAspect) && numericAspect > 0) {
        card.style.setProperty('--card-thumb-aspect', String(numericAspect));
      }
    }
  } else if (typeof thumbAspect === 'number' && Number.isFinite(thumbAspect) && thumbAspect > 0) {
    card.style.setProperty('--card-thumb-aspect', String(thumbAspect));
  }

  card.href = `projects/${project.id}.html`;
  card.innerHTML = `
    <div class="card__inner">
      <span class="tag-chip" role="note" aria-label="Category: ${categoryLabel}">${categoryLabel}</span>
      <div class="thumb"><img src="${project.thumb}" alt="${project.title}"></div>
      <div class="info">
        <h3>${project.title}</h3>
      </div>
    </div>
  `;
  return card;
}

function normalizeWheelDelta(event, element) {
  if (event.deltaMode === 1) {
    return event.deltaY * 32;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * element.clientWidth;
  }

  return event.deltaY;
}

function isWheelEventAllowedTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (target.closest('input, textarea, select') || target.closest('[contenteditable="true"]')) {
    return false;
  }

  const contactDialog = target.closest('[data-contact-dialog]');
  if (contactDialog && !contactDialog.hasAttribute('hidden')) {
    return false;
  }

  const siteMenu = target.closest('#siteMenu');
  if (siteMenu && siteMenu.dataset.open === 'true') {
    return false;
  }

  return true;
}

function handleCatalogWheel(event) {
  if (!catalog) {
    return;
  }

  if (catalog.scrollWidth <= catalog.clientWidth) {
    return;
  }

  if (event.defaultPrevented || event.ctrlKey || event.shiftKey) {
    return;
  }

  const target = event.target;
  if (!isWheelEventAllowedTarget(target)) {
    return;
  }

  const { deltaY } = event;
  if (deltaY === 0) {
    return;
  }

  const scrollAmount = normalizeWheelDelta(event, catalog);
  if (!Number.isFinite(scrollAmount) || scrollAmount === 0) {
    return;
  }

  const maxScrollLeft = catalog.scrollWidth - catalog.clientWidth;
  const epsilon = 0.5;
  const atStart = catalog.scrollLeft <= epsilon;
  const atEnd = catalog.scrollLeft >= maxScrollLeft - epsilon;

  if ((scrollAmount < 0 && atStart) || (scrollAmount > 0 && atEnd)) {
    return;
  }

  event.preventDefault();
  catalog.scrollLeft = Math.min(
    Math.max(catalog.scrollLeft + scrollAmount, 0),
    maxScrollLeft
  );
}

function getCatalogScrollAmount() {
  if (!catalog) {
    return 0;
  }

  const firstCard = catalog.querySelector('.card');
  if (!firstCard) {
    return catalog.clientWidth;
  }

  const cardRect = firstCard.getBoundingClientRect();
  const styles = window.getComputedStyle(catalog);
  const gapValue = styles.columnGap || styles.gap || '0px';
  const parsedGap = parseFloat(gapValue);
  const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

  return cardRect.width + gap;
}

function shouldIgnoreKeydownTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest('input, textarea, select') || target.closest('[contenteditable="true"]')) {
    return true;
  }

  return target.closest('[data-contact-dialog]') !== null;
}

function handleCatalogKeydown(event) {
  if (!catalog || event.defaultPrevented) {
    return;
  }

  const { key, ctrlKey, metaKey, altKey, target } = event;
  if (ctrlKey || metaKey || altKey) {
    return;
  }

  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
    return;
  }

  if (shouldIgnoreKeydownTarget(target)) {
    return;
  }

  const forward = key === 'ArrowRight' || key === 'ArrowDown';
  const maxScrollLeft = catalog.scrollWidth - catalog.clientWidth;
  if (maxScrollLeft <= 0) {
    return;
  }

  const epsilon = 0.5;
  const atStart = catalog.scrollLeft <= epsilon;
  const atEnd = catalog.scrollLeft >= maxScrollLeft - epsilon;
  if ((forward && atEnd) || (!forward && atStart)) {
    return;
  }

  const scrollAmount = getCatalogScrollAmount();
  if (!Number.isFinite(scrollAmount) || scrollAmount <= 0) {
    return;
  }

  const nextScrollLeft = Math.min(
    Math.max(catalog.scrollLeft + (forward ? scrollAmount : -scrollAmount), 0),
    maxScrollLeft
  );

  if (Math.abs(nextScrollLeft - catalog.scrollLeft) <= epsilon) {
    return;
  }

  event.preventDefault();
  catalog.scrollTo({ left: nextScrollLeft, behavior: 'smooth' });
}

function updateCatalogKeySupport() {
  if (!catalog) {
    if (keyListenerAttached) {
      window.removeEventListener('keydown', handleCatalogKeydown);
      keyListenerAttached = false;
    }
    return;
  }

  const hasOverflow = catalog.scrollWidth - catalog.clientWidth > 1;

  if (hasOverflow && !keyListenerAttached) {
    window.addEventListener('keydown', handleCatalogKeydown);
    keyListenerAttached = true;
  } else if (!hasOverflow && keyListenerAttached) {
    window.removeEventListener('keydown', handleCatalogKeydown);
    keyListenerAttached = false;
  }
}

function updateCatalogWheelSupport() {
  if (!catalog) {
    return;
  }

  const hasOverflow = catalog.scrollWidth - catalog.clientWidth > 1;

  if (hasOverflow && !wheelListenerAttached) {
    catalog.addEventListener('wheel', handleCatalogWheel, { passive: false });
    wheelListenerAttached = true;
  } else if (!hasOverflow && wheelListenerAttached) {
    catalog.removeEventListener('wheel', handleCatalogWheel);
    wheelListenerAttached = false;
  }

  updateCatalogKeySupport();
}

function renderProjects(projects) {
  if (!catalog) return;
  const fragment = document.createDocumentFragment();
  projects.forEach(project => fragment.appendChild(createCard(project)));
  catalog.appendChild(fragment);
  setupCatalogIndicators();
  updateCatalogWheelSupport();
  updateCatalogKeySupport();
}

function setupCatalogIndicators() {
  if (!catalog) return;
  const cards = Array.from(catalog.querySelectorAll('.card'));
  if (!cards.length) {
    updateCatalogKeySupport();
    return;
  }

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

  updateCatalogWheelSupport();
  updateCatalogKeySupport();
}

if (catalog) {
  fetch('data/projects.json')
    .then(response => response.json())
    .then(data => renderProjects(data))
    .catch(error => {
      console.error('Failed to load projects', error);
    });
} else {
  updateCatalogKeySupport();
}

window.addEventListener('resize', updateCatalogWheelSupport);

const logoLink = document.querySelector('.logo a');
const logoQuote = document.querySelector('.logo-quote');
const LOGO_QUOTE_ANIMATION_CLASS = 'is-animating';
const LOGO_QUOTE_ERASE_ANIMATION = 'logoQuoteErase';
let logoQuoteAnimating = false;

function updateLogoQuoteMetrics() {
  if (!logoQuote) {
    return;
  }

  const quoteWidth = logoQuote.scrollWidth;
  if (Number.isFinite(quoteWidth) && quoteWidth > 0) {
    logoQuote.style.setProperty('--logo-quote-width', `${quoteWidth}px`);
  }

  const quoteText = logoQuote.textContent ? logoQuote.textContent.trim() : '';
  if (quoteText) {
    logoQuote.style.setProperty('--logo-quote-steps', `${quoteText.length}`);
  }
}

function startLogoQuoteAnimation() {
  if (!logoQuote || logoQuoteAnimating) {
    return;
  }

  updateLogoQuoteMetrics();
  logoQuoteAnimating = true;
  logoQuote.classList.add(LOGO_QUOTE_ANIMATION_CLASS);
}

function handleLogoQuoteAnimationEnd(event) {
  if (!logoQuote || event.target !== logoQuote || event.animationName !== LOGO_QUOTE_ERASE_ANIMATION) {
    return;
  }

  logoQuote.classList.remove(LOGO_QUOTE_ANIMATION_CLASS);
  logoQuoteAnimating = false;
}

if (logoLink && logoQuote) {
  updateLogoQuoteMetrics();
  window.addEventListener('resize', updateLogoQuoteMetrics);
  window.addEventListener('load', updateLogoQuoteMetrics);
  logoLink.addEventListener('mouseenter', startLogoQuoteAnimation);
  logoLink.addEventListener('focus', startLogoQuoteAnimation);
  logoQuote.addEventListener('animationend', handleLogoQuoteAnimationEnd);
}
