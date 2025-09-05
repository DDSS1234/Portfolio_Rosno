const projects = [
  { id: 'p1', title: 'Project One', type: 'architecture' },
  { id: 'p2', title: 'Project Two', type: 'product' },
  { id: 'p3', title: 'Project Three', type: 'material' },
  { id: 'p4', title: 'Project Four', type: 'uiux' },
  { id: 'p5', title: 'Project Five', type: 'art' },
  { id: 'p6', title: 'Project Six', type: 'product' }
];

let currentIndex = 0;
const catalog = document.getElementById('catalog');
const filterBar = document.getElementById('filterBar');
const selectedTypes = new Set(['architecture','product','material','uiux','art']);

function renderCards() {
  const total = projects.length;
  projects.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = p.type;

    // Assign higher z-index to leftmost card and decrease to the right
    card.style.setProperty('--z', total - i);

    // Make card focusable for keyboard users
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="tag ${p.type}">
        <img src="icons/${p.type}.svg" alt="${p.type} icon">
      </div>
      <div class="thumb"></div>
      <div class="info">
        <h3>${p.title}</h3>
      </div>`;
    catalog.appendChild(card);
  });
}

function applyFilter() {
  Array.from(catalog.children).forEach(card => {
    const show = selectedTypes.has(card.dataset.type);
    if (!show && card.style.display !== 'none') {
      card.classList.add('filtering-out');
      card.addEventListener('animationend', () => {
        card.style.display = 'none';
        card.classList.remove('filtering-out');
        updateMobilePosition();
      }, { once: true });
    } else if (show && card.style.display === 'none') {
      card.style.display = '';
      card.classList.add('returning');
      card.addEventListener('animationend', () => {
        card.classList.remove('returning');
      }, { once: true });
    }
  });
  currentIndex = Math.min(currentIndex, getVisibleCards().length - 1);
  updateMobilePosition();
}

function getVisibleCards() {
  return Array.from(catalog.children).filter(c => c.style.display !== 'none');
}

function setupSwipe() {
  let startX = 0;
  catalog.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  catalog.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      const dir = dx < 0 ? 1 : -1;
      const visible = getVisibleCards();
      currentIndex = Math.min(Math.max(currentIndex + dir, 0), visible.length - 1);
      updateMobilePosition();
    }
  });
}

function updateMobilePosition() {
  if (window.matchMedia('(max-width: 600px)').matches) {
    const visible = getVisibleCards();
    const index = Math.min(currentIndex, visible.length - 1);
    catalog.style.transform = `translateX(-${index * 100}%)`;
  } else {
    catalog.style.transform = '';
  }
}

filterBar.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const type = btn.dataset.type;
  if (selectedTypes.has(type)) {
    selectedTypes.delete(type);
    btn.classList.remove('active');
  } else {
    selectedTypes.add(type);
    btn.classList.add('active');
  }
  applyFilter();
});
window.addEventListener('resize', updateMobilePosition);

renderCards();
setupSwipe();
applyFilter();

