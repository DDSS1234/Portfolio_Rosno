const state = {
  currentIndex: 0,
  isDetailOpen: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

let projects = [];

fetch('data/projects.json')
  .then(res => res.json())
  .then(data => {
    projects = data;
    initRing();
    updateCaption();
    bindEvents();
  });

function initRing() {
  const ring = document.getElementById('cardRing');
  const step = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ring-step'));
  projects.forEach((project, i) => {
    const li = document.createElement('li');
    li.className = 'card flex flex-col';
    li.id = `card-${project.id}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === state.currentIndex);
    li.tabIndex = i === state.currentIndex ? 0 : -1;
    li.innerHTML = `
      <img src="${project.linework}" alt="" class="thumb" />
      <div class="p-4">
        <h3 class="text-lg font-semibold">${project.title}</h3>
        <p class="text-sm opacity-70">${project.year}</p>
        <p class="text-sm mt-2">${project.hook}</p>
      </div>`;
    ring.appendChild(li);
  });
  arrangeCards();
}

function arrangeCards() {
  const ring = document.getElementById('cardRing');
  const cards = ring.querySelectorAll('.card');
  const stepDeg = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ring-step'));
  if (!cards.length) return;
  const radius = calcRadius(cards[0].offsetWidth, stepDeg);
  cards.forEach((card, i) => {
    const angle = stepDeg * i;
    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
  });
  setRotation(radius, stepDeg);
}

function calcRadius(width, stepDeg) {
  const stepRad = stepDeg * Math.PI / 180;
  return Math.round(width / 2 / Math.tan(stepRad / 2));
}

function setRotation(radius, stepDeg) {
  const ring = document.getElementById('cardRing');
  ring.style.transform = `translateZ(-${radius}px) rotateY(${-state.currentIndex * stepDeg}deg)`;
  updateCards();
}

function updateCards() {
  const ring = document.getElementById('cardRing');
  const cards = ring.querySelectorAll('.card');
  cards.forEach((card, i) => {
    const active = i === state.currentIndex;
    card.setAttribute('aria-selected', active);
    card.tabIndex = active ? 0 : -1;
    card.classList.toggle('active', active);
  });
  updateCaption();
}

function updateCaption() {
  const captionText = document.getElementById('captionText');
  const project = projects[state.currentIndex];
  if (project) {
    captionText.textContent = `${project.title} — ${project.hook}`;
  }
}

function rotate(delta) {
  const len = projects.length;
  state.currentIndex = (state.currentIndex + delta + len) % len;
  const stepDeg = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ring-step'));
  const card = document.querySelector('.card');
  const radius = card ? calcRadius(card.offsetWidth, stepDeg) : 0;
  setRotation(radius, stepDeg);
}

function bindEvents() {
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') rotate(1);
    if (e.key === 'ArrowLeft') rotate(-1);
    if (e.key === 'Enter') openDetail();
    if (e.key === 'Escape') closeDetail();
    if (e.key === ' ') { toggleOverlay(); e.preventDefault(); }
  });

  document.addEventListener('wheel', e => {
    if (e.deltaY > 0) rotate(1);
    else if (e.deltaY < 0) rotate(-1);
  });
}

function openDetail() {
  // Detail view placeholder
}

function closeDetail() {
  // Close detail placeholder
}

function toggleOverlay() {
  // Overlay toggle placeholder
}
