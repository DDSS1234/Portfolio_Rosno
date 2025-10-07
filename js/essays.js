const OVERLAY_ACTIVE_CLASS = 'is-active';

function getEssayParagraphs(essay) {
  if (!essay) {
    return [];
  }

  if (Array.isArray(essay.content)) {
    return essay.content.filter((paragraph) => typeof paragraph === 'string' && paragraph.trim().length);
  }

  if (typeof essay.content === 'string') {
    return essay.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  if (typeof essay.summary === 'string') {
    return [essay.summary];
  }

  return [];
}

document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('[data-essay-wrapper]');
  if (!wrapper) {
    return;
  }

  const emptyState = wrapper.querySelector('[data-essay-empty]');
  const indicatorPortal = document.querySelector('[data-catalog-indicators]');
  const overlay = document.querySelector('[data-essay-overlay]');
  const overlayPanel = overlay?.querySelector('[data-essay-overlay-panel]');
  const overlayTitle = overlay?.querySelector('[data-essay-title]');
  const overlayBody = overlay?.querySelector('[data-essay-body]');
  const closeButton = overlay?.querySelector('[data-essay-close]');

  const catalogManager = window.catalogManager;
  const catalogController =
    catalogManager && typeof catalogManager.register === 'function'
      ? catalogManager.register(wrapper, {
          indicatorPortal,
          cardSelector: '.essay-card',
          getIndicatorLabel: (card, index, total) => {
            const titleElement = card.querySelector('.essay-card__title');
            const essayTitle = titleElement ? titleElement.textContent.trim() : '';
            const baseLabel = `Slide ${index + 1} of ${total}`;
            return essayTitle ? `${baseLabel} — ${essayTitle}` : baseLabel;
          },
        })
      : typeof window.setupCatalog === 'function'
      ? window.setupCatalog(wrapper, {
          indicatorPortal,
          cardSelector: '.essay-card',
          getIndicatorLabel: (card, index, total) => {
            const titleElement = card.querySelector('.essay-card__title');
            const essayTitle = titleElement ? titleElement.textContent.trim() : '';
            const baseLabel = `Slide ${index + 1} of ${total}`;
            return essayTitle ? `${baseLabel} — ${essayTitle}` : baseLabel;
          },
        })
      : null;

  function refreshCatalog() {
    if (catalogManager && typeof catalogManager.refresh === 'function') {
      catalogManager.refresh(wrapper);
      return;
    }

    if (catalogController && typeof catalogController.refresh === 'function') {
      catalogController.refresh();
    }
  }

  const essaysById = new Map();
  let lastFocusedElement = null;
  let closeTimeoutId = null;

  function clearEssayCards() {
    wrapper.querySelectorAll('.essay-card').forEach((card) => card.remove());
  }

  function showEmpty(message) {
    clearEssayCards();

    if (emptyState) {
      if (message) {
        emptyState.textContent = message;
      }
      emptyState.hidden = false;
    }

    refreshCatalog();
  }

  function hideEmpty() {
    if (emptyState) {
      emptyState.hidden = true;
    }
  }

  function closeOverlay({ restoreFocus = true } = {}) {
    if (!overlay || overlay.hidden) {
      return;
    }

    overlay.classList.remove(OVERLAY_ACTIVE_CLASS);
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('essay-overlay-open');

    if (closeTimeoutId) {
      window.clearTimeout(closeTimeoutId);
      closeTimeoutId = null;
    }

    let finalized = false;
    const finalizeClose = () => {
      if (finalized) {
        return;
      }
      if (overlay.classList.contains(OVERLAY_ACTIVE_CLASS)) {
        overlay.removeEventListener('transitionend', finalizeClose);
        return;
      }
      finalized = true;
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', finalizeClose);
      closeTimeoutId = null;
    };

    overlay.addEventListener('transitionend', finalizeClose);
    closeTimeoutId = window.setTimeout(finalizeClose, 650);

    if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }

    lastFocusedElement = null;
  }

  function openOverlay(essay, triggerElement) {
    if (!overlay || !overlayPanel || !overlayBody || !essay) {
      return;
    }

    const paragraphs = getEssayParagraphs(essay);

    overlayBody.innerHTML = '';
    if (paragraphs.length) {
      paragraphs.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        overlayBody.appendChild(paragraph);
      });
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Essay content coming soon.';
      overlayBody.appendChild(paragraph);
    }

    if (overlayTitle) {
      overlayTitle.textContent = essay.title || '';
    }

    lastFocusedElement = triggerElement || document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('essay-overlay-open');

    if (closeTimeoutId) {
      window.clearTimeout(closeTimeoutId);
      closeTimeoutId = null;
    }

    requestAnimationFrame(() => {
      overlay.classList.add(OVERLAY_ACTIVE_CLASS);
      if (closeButton) {
        closeButton.focus();
      } else if (overlayPanel instanceof HTMLElement) {
        overlayPanel.focus();
      }
    });
  }

  function handleCardClick(event) {
    const button = event.currentTarget;
    const essayId = button?.getAttribute('data-essay-id');
    if (!essayId || !essaysById.has(essayId)) {
      return;
    }

    const essay = essaysById.get(essayId);
    openOverlay(essay, button);
  }

  function renderEssayCard(essay) {
    if (!essay || typeof essay.title !== 'string') {
      return null;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'essay-card';
    button.dataset.essayId = essay.id || essay.slug || essay.title;

    const desktopContent = document.createElement('div');
    desktopContent.className = 'essay-card__content';

    const heading = document.createElement('div');
    heading.className = 'essay-card__heading';

    const title = document.createElement('h3');
    title.className = 'essay-card__title';
    title.textContent = essay.title;
    heading.appendChild(title);

    desktopContent.appendChild(heading);

    if (essay.summary) {
      const summary = document.createElement('p');
      summary.className = 'essay-card__summary';
      summary.textContent = essay.summary;
      desktopContent.appendChild(summary);
    }

    button.appendChild(desktopContent);

    const mobileContent = document.createElement('div');
    mobileContent.className = 'essay-card__mobile';

    const microTitleText = typeof essay.microTitle === 'string' && essay.microTitle.trim().length
      ? essay.microTitle.trim()
      : essay.title;
    const microTitle = document.createElement('span');
    microTitle.className = 'essay-card__micro-title';
    microTitle.textContent = microTitleText;
    mobileContent.appendChild(microTitle);

    const labelText = typeof essay.label === 'string' && essay.label.trim().length
      ? essay.label.trim()
      : essay.summary || '';
    if (labelText) {
      const label = document.createElement('span');
      label.className = 'essay-card__label';
      label.textContent = labelText;
      mobileContent.appendChild(label);
    }

    button.appendChild(mobileContent);

    button.addEventListener('click', handleCardClick);

    return button;
  }

  function hydrateOverlayEvents() {
    if (!overlay) {
      return;
    }

    overlay.addEventListener('click', (event) => {
      if (!overlay.hidden && event.target === overlay) {
        closeOverlay();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay?.hidden) {
        closeOverlay();
      }
    });

    if (closeButton) {
      closeButton.addEventListener('click', () => closeOverlay());
    }
  }

  hydrateOverlayEvents();

  fetch('data/essays.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load essays: ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      const essays = Array.isArray(data)
        ? data
        : data && Array.isArray(data.essays)
        ? data.essays
        : [];

      const validEssays = essays.filter(
        (essay) => essay && typeof essay.title === 'string' && typeof essay.publishedAt === 'string',
      );

      if (!validEssays.length) {
        showEmpty('Essays will live here soon. Check back for fresh notes.');
        return;
      }

      hideEmpty();
      clearEssayCards();

      const fragment = document.createDocumentFragment();
      validEssays
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .forEach((essay) => {
          const card = renderEssayCard(essay);
          if (card) {
            const essayId = card.dataset.essayId;
            if (essayId) {
              essaysById.set(essayId, essay);
            }
            fragment.appendChild(card);
          }
        });

      wrapper.appendChild(fragment);

    refreshCatalog();
    })
    .catch((error) => {
      console.error(error);
      showEmpty('Unable to load essays right now. Please try again later.');
    });
});
