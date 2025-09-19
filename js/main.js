const catalog = document.getElementById('catalog');
let indicatorContainer;
let indicatorButtons = [];
let scrollAnimationFrame = null;
let listenersAttached = false;

function createCard(project) {
  const type = Array.isArray(project.tags) && project.tags.length
    ? project.tags[0]
    : 'product';
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `projects/${project.id}.html`;
  card.innerHTML = `
    <div class="tag ${type}">
      <img src="icons/${type}.svg" alt="${type} icon">
    </div>
    <div class="thumb"><img src="${project.thumb}" alt="${project.title}"></div>
    <div class="info">
      <h3>${project.title}</h3>
    </div>
  `;
  return card;
}

function renderProjects(projects) {
  if (!catalog) return;
  const fragment = document.createDocumentFragment();
  projects.forEach(project => fragment.appendChild(createCard(project)));
  catalog.appendChild(fragment);
  setupCatalogIndicators();
}

function setupCatalogIndicators() {
  if (!catalog) return;
  const cards = Array.from(catalog.querySelectorAll('.card'));
  if (!cards.length) return;

  if (!indicatorContainer) {
    indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'catalog-indicators';
    catalog.insertAdjacentElement('afterend', indicatorContainer);
  }

  indicatorContainer.innerHTML = '';
  indicatorButtons = cards.map((card, index) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.className = 'catalog-indicator';
    indicator.dataset.index = String(index);
    const percent = cards.length === 1 ? 100 : Math.round((index / (cards.length - 1)) * 100);
    indicator.setAttribute('aria-label', `Scroll to ${percent}%`);
    indicator.title = `${percent}%`;
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
}

fetch('data/projects.json')
  .then(response => response.json())
  .then(data => renderProjects(data))
  .catch(error => {
    console.error('Failed to load projects', error);
  });
