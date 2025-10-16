(function () {
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

  function shouldIgnoreKeydownTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (target.closest('input, textarea, select') || target.closest('[contenteditable="true"]')) {
      return true;
    }

    return target.closest('[data-contact-dialog]') !== null;
  }

  function defaultIndicatorLabel(card, index, total) {
    return `Slide ${index + 1} of ${total}`;
  }

  function setupCatalog(root, options = {}) {
    if (!(root instanceof HTMLElement)) {
      return null;
    }

    const state = {
      root,
      indicatorPortal: options.indicatorPortal instanceof HTMLElement ? options.indicatorPortal : null,
      indicatorContainer: options.indicatorPortal instanceof HTMLElement ? options.indicatorPortal : null,
      indicatorFill: null,
      scrollAnimationFrame: null,
      listenersAttached: false,
      wheelListenerAttached: false,
      keyListenerAttached: false,
      cardSelector: typeof options.cardSelector === 'string' && options.cardSelector.trim() ? options.cardSelector : '.card',
      getIndicatorLabel:
        typeof options.getIndicatorLabel === 'function' ? options.getIndicatorLabel : defaultIndicatorLabel,
    };

    const resizeHandler = () => {
      refreshIndicators();
      updateWheelSupport();
    };

    function getCards() {
      return Array.from(state.root.querySelectorAll(state.cardSelector));
    }

    function handleWheel(event) {
      if (state.root.scrollWidth <= state.root.clientWidth) {
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

      const scrollAmount = normalizeWheelDelta(event, state.root);
      if (!Number.isFinite(scrollAmount) || scrollAmount === 0) {
        return;
      }

      const maxScrollLeft = state.root.scrollWidth - state.root.clientWidth;
      const epsilon = 0.5;
      const atStart = state.root.scrollLeft <= epsilon;
      const atEnd = state.root.scrollLeft >= maxScrollLeft - epsilon;

      if ((scrollAmount < 0 && atStart) || (scrollAmount > 0 && atEnd)) {
        return;
      }

      event.preventDefault();
      state.root.scrollLeft = Math.min(
        Math.max(state.root.scrollLeft + scrollAmount, 0),
        maxScrollLeft,
      );
    }

    function getScrollAmount() {
      const firstCard = state.root.querySelector(state.cardSelector);
      if (!firstCard) {
        return state.root.clientWidth;
      }

      const cardRect = firstCard.getBoundingClientRect();
      const styles = window.getComputedStyle(state.root);
      const gapValue = styles.columnGap || styles.gap || '0px';
      const parsedGap = parseFloat(gapValue);
      const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

      return cardRect.width + gap;
    }

    function handleKeydown(event) {
      if (event.defaultPrevented) {
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
      const maxScrollLeft = state.root.scrollWidth - state.root.clientWidth;
      if (maxScrollLeft <= 0) {
        return;
      }

      const epsilon = 0.5;
      const atStart = state.root.scrollLeft <= epsilon;
      const atEnd = state.root.scrollLeft >= maxScrollLeft - epsilon;
      if ((forward && atEnd) || (!forward && atStart)) {
        return;
      }

      const scrollAmount = getScrollAmount();
      if (!Number.isFinite(scrollAmount) || scrollAmount <= 0) {
        return;
      }

      const nextScrollLeft = Math.min(
        Math.max(state.root.scrollLeft + (forward ? scrollAmount : -scrollAmount), 0),
        maxScrollLeft,
      );

      if (Math.abs(nextScrollLeft - state.root.scrollLeft) <= 0.5) {
        return;
      }

      event.preventDefault();
      state.root.scrollTo({ left: nextScrollLeft, behavior: 'smooth' });
    }

    function updateKeySupport() {
      const hasOverflow = state.root.scrollWidth - state.root.clientWidth > 1;

      if (hasOverflow && !state.keyListenerAttached) {
        window.addEventListener('keydown', handleKeydown);
        state.keyListenerAttached = true;
      } else if (!hasOverflow && state.keyListenerAttached) {
        window.removeEventListener('keydown', handleKeydown);
        state.keyListenerAttached = false;
      }
    }

    function updateWheelSupport() {
      const hasOverflow = state.root.scrollWidth - state.root.clientWidth > 1;

      if (hasOverflow && !state.wheelListenerAttached) {
        state.root.addEventListener('wheel', handleWheel, { passive: false });
        state.wheelListenerAttached = true;
      } else if (!hasOverflow && state.wheelListenerAttached) {
        state.root.removeEventListener('wheel', handleWheel);
        state.wheelListenerAttached = false;
      }

      updateKeySupport();
    }

    function clearIndicators() {
      state.indicatorFill = null;
      if (state.indicatorContainer && state.indicatorContainer !== state.indicatorPortal) {
        state.indicatorContainer.innerHTML = '';
      } else if (state.indicatorContainer && state.indicatorPortal) {
        state.indicatorContainer.innerHTML = '';
      }
      if (state.indicatorContainer) {
        state.indicatorContainer.removeAttribute('role');
        state.indicatorContainer.removeAttribute('aria-valuemin');
        state.indicatorContainer.removeAttribute('aria-valuemax');
        state.indicatorContainer.removeAttribute('aria-valuenow');
        state.indicatorContainer.removeAttribute('aria-valuetext');
      }
    }

    function handleScroll() {
      if (state.scrollAnimationFrame !== null) {
        return;
      }

      state.scrollAnimationFrame = window.requestAnimationFrame(() => {
        state.scrollAnimationFrame = null;
        updateIndicators();
      });
    }

    function ensureIndicatorContainer() {
      if (state.indicatorContainer instanceof HTMLElement) {
        if (!state.indicatorContainer.classList.contains('catalog-indicators')) {
          state.indicatorContainer.classList.add('catalog-indicators');
        }
        return state.indicatorContainer;
      }

      const container = document.createElement('div');
      container.className = 'catalog-indicators';
      if (state.indicatorPortal) {
        state.indicatorPortal.appendChild(container);
      } else {
        state.root.insertAdjacentElement('afterend', container);
      }

      state.indicatorContainer = container;
      return container;
    }

    function updateIndicators() {
      if (!state.indicatorFill) {
        updateWheelSupport();
        return;
      }

      const maxScroll = state.root.scrollWidth - state.root.clientWidth;
      const progress = maxScroll > 0 ? state.root.scrollLeft / maxScroll : 0;
      const clampedProgress = Math.max(0, Math.min(progress, 1));

      if (state.indicatorContainer) {
        const containerWidth = state.indicatorContainer.clientWidth;
        const thumbWidth = state.indicatorFill.offsetWidth;
        const maxOffset = Math.max(containerWidth - thumbWidth, 0);
        const offset = maxOffset * clampedProgress;
        state.indicatorFill.style.transform = `translateX(${offset}px) translateY(-50%)`;
      }

      if (state.indicatorContainer) {
        state.indicatorContainer.setAttribute('aria-valuenow', String(Math.round(clampedProgress * 100)));
        const cards = getCards();
        if (cards.length > 1) {
          const approxIndex = Math.round(clampedProgress * (cards.length - 1)) + 1;
          state.indicatorContainer.setAttribute('aria-valuetext', `Slide ${approxIndex} of ${cards.length}`);
        } else {
          state.indicatorContainer.removeAttribute('aria-valuetext');
        }
      }

      updateWheelSupport();
    }

    function setupIndicators() {
      const cards = getCards();
      if (!cards.length) {
        clearIndicators();
        updateWheelSupport();
        updateKeySupport();
        return;
      }

      const container = ensureIndicatorContainer();
      container.innerHTML = '';
      container.setAttribute('role', 'progressbar');
      container.setAttribute('aria-valuemin', '0');
      container.setAttribute('aria-valuemax', '100');

      const fill = document.createElement('div');
      fill.className = 'catalog-indicator__fill';
      container.appendChild(fill);
      state.indicatorFill = fill;

      if (!state.listenersAttached) {
        state.root.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', resizeHandler);
        state.listenersAttached = true;
      }

      updateIndicators();
    }

    function refreshIndicators() {
      setupIndicators();
    }

    function destroy() {
      if (state.listenersAttached) {
        state.root.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', resizeHandler);
        state.listenersAttached = false;
      }

      if (state.wheelListenerAttached) {
        state.root.removeEventListener('wheel', handleWheel);
        state.wheelListenerAttached = false;
      }

      if (state.keyListenerAttached) {
        window.removeEventListener('keydown', handleKeydown);
        state.keyListenerAttached = false;
      }

      if (state.scrollAnimationFrame !== null) {
        window.cancelAnimationFrame(state.scrollAnimationFrame);
        state.scrollAnimationFrame = null;
      }

      clearIndicators();
    }

    setupIndicators();
    updateWheelSupport();

    return {
      refresh: refreshIndicators,
      destroy,
    };
  }

  window.setupCatalog = setupCatalog;

  const catalogControllers = new WeakMap();

  function registerCatalog(root, options = {}) {
    if (!(root instanceof HTMLElement)) {
      return null;
    }

    const existing = catalogControllers.get(root);
    if (existing && typeof existing.destroy === 'function') {
      existing.destroy();
    }

    const controller = setupCatalog(root, options);
    if (controller) {
      catalogControllers.set(root, controller);
    }

    return controller;
  }

  function refreshCatalog(root) {
    const controller = catalogControllers.get(root);
    if (controller && typeof controller.refresh === 'function') {
      controller.refresh();
    }
  }

  function destroyCatalog(root) {
    const controller = catalogControllers.get(root);
    if (controller && typeof controller.destroy === 'function') {
      controller.destroy();
    }
    catalogControllers.delete(root);
  }

  window.catalogManager = {
    register: registerCatalog,
    refresh: refreshCatalog,
    destroy: destroyCatalog,
    get(root) {
      return catalogControllers.get(root) || null;
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const catalog = document.getElementById('catalog');
  const indicatorPortal = document.querySelector('[data-catalog-indicators]');
  let catalogController = null;

  const categoryLabels = {
    architecture: 'Architecture',
    product: 'Product',
    material: 'Material',
    'ui/ux': 'UI/UX',
    uiux: 'UI/UX',
    'ui-ux': 'UI/UX',
    art: 'Art',
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
    const type = Array.isArray(project.tags) && project.tags.length ? project.tags[0] : 'product';
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
          <h3Title>${project.title}</h3Title>
        </div>
      </div>
    `;
    return card;
  }

  function renderProjects(projects) {
    if (!catalog) {
      return;
    }

    const fragment = document.createDocumentFragment();
    projects.forEach((project) => fragment.appendChild(createCard(project)));
    catalog.appendChild(fragment);

    if (catalogController) {
      catalogController.refresh();
    }
  }

  function setupCatalogController() {
    if (!catalog || !window.catalogManager || typeof window.catalogManager.register !== 'function') {
      return;
    }

    catalogController = window.catalogManager.register(catalog, {
      indicatorPortal,
      cardSelector: '.card',
      getIndicatorLabel: (card, index, total) => {
        const titleElement = card.querySelector('h3Title');
        const projectTitle = titleElement ? titleElement.textContent.trim() : '';
        const baseLabel = `Slide ${index + 1} of ${total}`;
        return projectTitle ? `${baseLabel} — ${projectTitle}` : baseLabel;
      },
    });
  }

  if (catalog) {
    setupCatalogController();

    fetch('data/projects.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => renderProjects(data))
      .catch((error) => {
        console.error('Failed to load projects', error);
      });
  }
});

// Logo quote hover animation removed; visibility is now handled solely in CSS.
