document.addEventListener('DOMContentLoaded', () => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const indicatorContainer = document.querySelector('[data-catalog-indicators]');
  let indicatorButtons = [];
  let index = Math.max(slides.findIndex(slide => slide.classList.contains('active')), 0);
  let animating = false;

  function updateIndicators(activeIndex) {
    if (!indicatorButtons.length) return;
    indicatorButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function show(newIndex) {
    if (animating || newIndex === index || newIndex < 0 || newIndex >= slides.length) return;
    animating = true;
    const current = slides[index];
    const next = slides[newIndex];
    const direction = newIndex > index ? 1 : -1;

    if (direction === 1) {
      current.classList.add('exit-left');
      next.classList.add('enter-right');
    } else {
      current.classList.add('exit-right');
      next.classList.add('enter-left');
    }

    next.addEventListener('animationend', () => {
      current.classList.remove('exit-left', 'exit-right', 'active');
      next.classList.remove('enter-right', 'enter-left');
      next.classList.add('active');
      index = newIndex;
      animating = false;
      updateIndicators(index);
    }, { once: true });
  }

  function createIndicators() {
    if (!indicatorContainer || !slides.length) {
      return;
    }

    indicatorContainer.innerHTML = '';
    indicatorButtons = slides.map((slide, slideIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'catalog-indicator';
      button.dataset.index = String(slideIndex);
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
      const title = heading ? heading.textContent.trim() : '';
      const label = `Slide ${slideIndex + 1} of ${slides.length}${title ? ` — ${title}` : ''}`;
      button.setAttribute('aria-label', label);
      button.addEventListener('click', () => {
        show(slideIndex);
      });
      indicatorContainer.appendChild(button);
      return button;
    });

    updateIndicators(index);
  }

  createIndicators();

  window.addEventListener('wheel', e => {
    if (e.deltaY > 0) {
      show(index + 1);
    } else if (e.deltaY < 0) {
      show(index - 1);
    }
  }, { passive: true });
});

