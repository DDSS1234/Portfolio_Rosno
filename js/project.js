document.addEventListener('DOMContentLoaded', () => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  let index = 0;
  let animating = false;

  function show(newIndex, dir) {
    if (animating || newIndex < 0 || newIndex >= slides.length) return;
    animating = true;
    const current = slides[index];
    const next = slides[newIndex];

    if (dir === 1) {
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
    }, { once: true });
  }

  window.addEventListener('wheel', e => {
    if (e.deltaY > 0) {
      show(index + 1, 1);
    } else if (e.deltaY < 0) {
      show(index - 1, -1);
    }
  }, { passive: true });
});

