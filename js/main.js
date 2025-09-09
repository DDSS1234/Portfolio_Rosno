let projects = [];
let currentIndex = 0;
const catalog = document.getElementById('catalog');
const filterBar = document.getElementById('filterBar');
const selectedTypes = new Set(['architecture','product','material','uiux','art']);

function renderCards() {
  catalog.innerHTML = '';
  const total = projects.length;
  projects.forEach((p, i) => {
    const type = p.tags && p.tags.length ? p.tags[0] : 'product';
    const card = document.createElement('a');
    card.className = 'card project-card';
    card.dataset.type = type;
    card.style.setProperty('--z', total - i);
    card.href = `projects/${p.id}.html`;

    card.innerHTML = `
      <div class="tag ${type}">
        <img src="icons/${type}.svg" alt="${type} icon">
      </div>
      <div class="thumb"><img src="${p.thumb}" alt="${p.title}"></div>
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

function setupHover() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE_THRESHOLD = 100;

  function reset() {
    Array.from(catalog.querySelectorAll('.project-card')).forEach(card => {
      card.classList.remove('active', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5');
      card.style.setProperty('--ty', '0px');
    });
  }

  function onMove(e) {
    if (window.innerWidth < 600) {
      reset();
      return;
    }
    const cards = Array.from(catalog.querySelectorAll('.project-card')).filter(c => c.style.display !== 'none');
    if (!cards.length) return;
    const x = e.clientX;
    let closest = null;
    let minDist = Infinity;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(x - center);
      card.dataset.dist = dist;
      if (dist < minDist) { minDist = dist; closest = card; }
    });
    cards.forEach(card => {
      card.classList.remove('active', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5');
      const dist = parseFloat(card.dataset.dist);
      if (card === closest) {
        card.classList.add('active');
        const ty = prefersReducedMotion ? 0 : -10;
        card.style.setProperty('--ty', `${ty}px`);
      } else {
        const ty = prefersReducedMotion ? 0 : Math.min((dist / BASE_THRESHOLD) * 10, 40);
        card.style.setProperty('--ty', `${ty}px`);
        if (dist < BASE_THRESHOLD) card.classList.add('tier1');
        else if (dist < BASE_THRESHOLD * 2) card.classList.add('tier2');
        else if (dist < BASE_THRESHOLD * 3) card.classList.add('tier3');
        else if (dist < BASE_THRESHOLD * 4) card.classList.add('tier4');
        else if (dist < BASE_THRESHOLD * 5) card.classList.add('tier5');
      }
    });
  }

  catalog.addEventListener('pointermove', onMove);
  catalog.addEventListener('pointerleave', reset);
  window.addEventListener('resize', () => {
    if (window.innerWidth < 600) reset();
  });
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

fetch('data/projects.json')
  .then(res => res.json())
  .then(data => {
    projects = data;
    renderCards();
    setupSwipe();
    applyFilter();
    setupHover();
  });

