document.addEventListener('DOMContentLoaded', () => {
  const catalog = document.querySelector('.slide-container');
  if (!catalog) {
    return;
  }

  const slides = Array.from(catalog.querySelectorAll('.slide'));
  const indicatorContainer = document.querySelector('[data-catalog-indicators]');
  let indicatorFill = null;
  let scrollAnimationFrame = null;
  let wheelListenerAttached = false;
  let keyListenerAttached = false;

  function createIndicators() {
    if (!indicatorContainer || !slides.length) {
      indicatorFill = null;
      return;
    }

    indicatorContainer.innerHTML = '';
    indicatorContainer.setAttribute('role', 'progressbar');
    indicatorContainer.setAttribute('aria-valuemin', '0');
    indicatorContainer.setAttribute('aria-valuemax', '100');

    const fill = document.createElement('div');
    fill.className = 'catalog-indicator__fill';
    indicatorContainer.appendChild(fill);
    indicatorFill = fill;
  }

  function updateIndicatorState() {
    if (!indicatorFill) {
      updateWheelSupport();
      updateKeySupport();
      return;
    }

    const maxScroll = catalog.scrollWidth - catalog.clientWidth;
    const progress = maxScroll > 0 ? catalog.scrollLeft / maxScroll : 0;
    const clampedProgress = Math.max(0, Math.min(progress, 1));

    const containerWidth = indicatorContainer ? indicatorContainer.clientWidth : 0;
    const thumbWidth = indicatorFill.offsetWidth;
    const maxOffset = Math.max(containerWidth - thumbWidth, 0);
    const offset = maxOffset * clampedProgress;
    indicatorFill.style.transform = `translateX(${offset}px) translateY(-50%)`;
    indicatorContainer.setAttribute('aria-valuenow', String(Math.round(clampedProgress * 100)));

    if (slides.length > 1) {
      const approxIndex = Math.round(clampedProgress * (slides.length - 1)) + 1;
      indicatorContainer.setAttribute('aria-valuetext', `Slide ${approxIndex} of ${slides.length}`);
    } else {
      indicatorContainer.removeAttribute('aria-valuetext');
    }

    updateWheelSupport();
    updateKeySupport();
  }

  function handleScroll() {
    if (scrollAnimationFrame !== null) {
      return;
    }

    scrollAnimationFrame = window.requestAnimationFrame(() => {
      scrollAnimationFrame = null;
      updateIndicatorState();
    });
  }

  function normalizeWheelDelta(event) {
    if (event.deltaMode === 1) {
      return event.deltaY * 32;
    }

    if (event.deltaMode === 2) {
      return event.deltaY * catalog.clientWidth;
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

  function handleWheel(event) {
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

    const scrollAmount = normalizeWheelDelta(event);
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
    if (!slides.length) {
      return catalog.clientWidth;
    }

    const firstSlide = slides[0];
    const slideRect = firstSlide.getBoundingClientRect();
    const styles = window.getComputedStyle(catalog);
    const gapValue = styles.columnGap || styles.gap || '0px';
    const parsedGap = parseFloat(gapValue);
    const gap = Number.isFinite(parsedGap) ? parsedGap : 0;

    return slideRect.width + gap;
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

  function updateKeySupport() {
    const hasOverflow = catalog.scrollWidth - catalog.clientWidth > 1;

    if (hasOverflow && !keyListenerAttached) {
      window.addEventListener('keydown', handleKeydown);
      keyListenerAttached = true;
    } else if (!hasOverflow && keyListenerAttached) {
      window.removeEventListener('keydown', handleKeydown);
      keyListenerAttached = false;
    }
  }

  function updateWheelSupport() {
    const hasOverflow = catalog.scrollWidth - catalog.clientWidth > 1;

    if (hasOverflow && !wheelListenerAttached) {
      catalog.addEventListener('wheel', handleWheel, { passive: false });
      wheelListenerAttached = true;
    } else if (!hasOverflow && wheelListenerAttached) {
      catalog.removeEventListener('wheel', handleWheel);
      wheelListenerAttached = false;
    }
  }

  createIndicators();
  updateIndicatorState();
  catalog.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateIndicatorState();
    updateWheelSupport();
    updateKeySupport();
  });
  window.addEventListener('load', () => {
    updateIndicatorState();
    updateWheelSupport();
    updateKeySupport();
  });
});

