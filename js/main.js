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
    card.className = 'card';
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
  });

