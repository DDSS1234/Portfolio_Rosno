let projects = [];
let currentIndex = 0;
const catalog = document.getElementById('catalog');
const filterBar = document.getElementById('filterBar');
const selectedTypes = new Set(['architecture','product','material','uiux','art']);

// Ambient card state
let ambientIndex = 0;
let ambientTimer = null;


function generateStrikeImage(widthPx, heightPx, squarePx) {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  // Normalize to perfectly fill with whole number of squares
  const squares = Math.max(1, Math.round(widthPx / squarePx));
  const step = widthPx / squares;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(widthPx * dpr));
  canvas.height = Math.max(1, Math.round(heightPx * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // Progressive greys from black (left) to light grey (#d3d3d3) (right)
  const max = 211; // 0xD3
  for (let i = 0; i < squares; i++) {
    const t = squares === 1 ? 1 : i / (squares - 1);
    const v = Math.round(max * t);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const x = i * step;
    ctx.fillRect(x, 0, Math.ceil(step), heightPx);
  }
  return canvas.toDataURL('image/png');
}

function applyStrikeToButton(btn) {
  const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const square = 0.25 * rootFont; // 0.25rem in px
  // Use content box width to match ::after positioning
  const rect = btn.getBoundingClientRect();
  const width = rect.width;
  const height = 0.25 * rootFont;
  const url = generateStrikeImage(width, height, square);
  btn.style.setProperty('--strike-image', `url(${url})`);
}

function setupFilterStrikes() {
  const buttons = filterBar ? Array.from(filterBar.querySelectorAll('.filter-btn')) : [];
  buttons.forEach(applyStrikeToButton);
}

// Recompute on resize (debounced)
let __strikeResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(__strikeResizeTimer);
  __strikeResizeTimer = setTimeout(setupFilterStrikes, 150);
});

function renderCards() {
  catalog.innerHTML = '';
  const total = projects.length;
  projects.forEach((p, i) => {
    const type = p.tags && p.tags.length ? p.tags[0] : 'product';
    const card = document.createElement('a');
    card.className = 'card project-card';
    card.dataset.type = type;
    // Base stacking order starting at 991 for the bottom card
    card.style.setProperty('--z', 991 + (total - i - 1));
    card.href = `projects/${p.id}.html`;

    card.innerHTML = `
      <div class="tag ${type}">
        <img src="icons/${type}.svg" alt="${type} icon">
      </div>
      <div class="thumb"><img src="${p.thumb}" alt="${p.title}"></div>
      <div class="info">
        <h3>${p.title}</h3>
      </div>
      <svg class="ambient-outline" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="1" y="1" width="98" height="98" rx="8" ry="8"></rect>
      </svg>`;

    catalog.appendChild(card);
  });
  setupAmbientOutlines();
  updateEdgeClasses();
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
        updateEdgeClasses();
      }, { once: true });
    } else if (show && card.style.display === 'none') {
      card.style.display = '';
      card.classList.add('returning');
      card.addEventListener('animationend', () => {
        card.classList.remove('returning');
        updateEdgeClasses();
      }, { once: true });
    }
  });
  currentIndex = Math.min(currentIndex, getVisibleCards().length - 1);
  updateMobilePosition();
  updateEdgeClasses();
  stopAmbient();
  startAmbient();
}

function getVisibleCards() {
  return Array.from(catalog.children).filter(c => c.style.display !== 'none');
}

function updateEdgeClasses() {
  const visible = getVisibleCards();
  visible.forEach(card => card.classList.remove('first-visible', 'last-visible'));
  if (visible.length) {
    visible[0].classList.add('first-visible');
    visible[visible.length - 1].classList.add('last-visible');
  }
}

function setupSwipe() {
  let startX = 0;
  let dragging = false;
  catalog.addEventListener('touchstart', e => {
    if (!window.matchMedia('(max-width: 600px)').matches) return;
    startX = e.touches[0].clientX;
    dragging = true;
    catalog.style.transition = 'none';
  }, { passive: true });
  catalog.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    const width = catalog.clientWidth;
    catalog.style.transform = `translateX(${-currentIndex * width + dx}px)`;
  }, { passive: true });

  catalog.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    const width = catalog.clientWidth;
    if (Math.abs(dx) > width * 0.2) {
      const dir = dx < 0 ? 1 : -1;
      const visible = getVisibleCards();
      currentIndex = Math.min(Math.max(currentIndex + dir, 0), visible.length - 1);
    }
    catalog.style.transition = 'transform 0.3s ease';
    updateMobilePosition();
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

function setupAmbientOutlines() {
  const cards = Array.from(catalog.querySelectorAll('.project-card'));
  cards.forEach(card => {
    card.style.zIndex = card.style.getPropertyValue('--z') || 991;
    const rect = card.querySelector('.ambient-outline rect');
    if (rect) {
      const len = rect.getTotalLength();
      rect.dataset.len = len;
      rect.style.strokeDasharray = len;
      rect.style.strokeDashoffset = len;
    }
  });
}
function startAmbient() {
  if (window.matchMedia('(max-width: 600px)').matches) return;
  stopAmbient();
  const visible = getVisibleCards();
  if (!visible.length) return;
  const card = visible[ambientIndex % visible.length];
  card.classList.add('ambient-active');
  card.style.zIndex = 999;
  const rect = card.querySelector('.ambient-outline rect');
  if (rect) {
    rect.style.animation = 'none';
    rect.offsetWidth; // reset animation
    rect.style.animation = '';
  }
  ambientTimer = setTimeout(advanceAmbient, 5000);
}
function advanceAmbient() {
  const visible = getVisibleCards();
  if (!visible.length) return;
  const card = visible[ambientIndex % visible.length];
  card.classList.remove('ambient-active');
  card.style.zIndex = 991;
  const rect = card.querySelector('.ambient-outline rect');
  if (rect) {
    const len = rect.dataset.len;
    rect.style.strokeDashoffset = len;
    rect.style.animation = 'none';
    rect.offsetWidth;
    rect.style.animation = '';
  }
  ambientIndex = (ambientIndex + 1) % visible.length;
  startAmbient();
}
function stopAmbient() {
  clearTimeout(ambientTimer);
  const current = document.querySelector('.project-card.ambient-active');
  if (current) {
    current.classList.remove('ambient-active');
    current.style.zIndex = 991;
    const rect = current.querySelector('.ambient-outline rect');
    if (rect) {
      const len = rect.dataset.len;
      rect.style.strokeDashoffset = len;
      rect.style.animation = 'none';
      rect.offsetWidth;
      rect.style.animation = '';
    }
  }
}


function setupHover() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE_THRESHOLD = 100;

  function reset() {
    Array.from(catalog.querySelectorAll('.project-card')).forEach(card => {
      card.classList.remove('active', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6', 'tier7', 'tier8', 'tier9');
      card.style.setProperty('--ty', '0px');
    });
  }

  function onMove(e) {
    stopAmbient();
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
      card.classList.remove('active', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6', 'tier7', 'tier8', 'tier9');
      const dist = parseFloat(card.dataset.dist);
      if (card === closest) {
        card.classList.add('active');
        const ty = prefersReducedMotion ? 0 : -10;
        card.style.setProperty('--ty', `${ty}px`);
      } else {
        const ty = prefersReducedMotion ? 0 : Math.min((dist / BASE_THRESHOLD) * 10, 10);
        card.style.setProperty('--ty', `${ty}px`);
        if (dist < BASE_THRESHOLD) card.classList.add('tier1');
        else if (dist < BASE_THRESHOLD * 2) card.classList.add('tier2');
        else if (dist < BASE_THRESHOLD * 3) card.classList.add('tier3');
        else if (dist < BASE_THRESHOLD * 4) card.classList.add('tier4');
        else if (dist < BASE_THRESHOLD * 5) card.classList.add('tier5');
        else if (dist < BASE_THRESHOLD * 6) card.classList.add('tier6');
        else if (dist < BASE_THRESHOLD * 7) card.classList.add('tier7');
        else if (dist < BASE_THRESHOLD * 8) card.classList.add('tier8');      
        else if (dist < BASE_THRESHOLD * 9) card.classList.add('tier9');          
      }
    });
  }

  catalog.addEventListener('pointermove', onMove);
  catalog.addEventListener('pointerenter', stopAmbient);
  catalog.addEventListener('pointerleave', () => { reset(); startAmbient(); });
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
// Initialize strike images for filter buttons
setupFilterStrikes();

fetch('data/projects.json')
  .then(res => res.json())
  .then(data => {
    projects = data;
    renderCards();
    setupSwipe();
    applyFilter();
    setupHover();
    startAmbient();
  });

