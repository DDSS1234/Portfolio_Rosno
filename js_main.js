const state = {
  currentIndex: 0,
  isDetailOpen: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

let projects = [];
const boot = () => { initRing(); updateCaption(); bindEvents(); };

fetch('data/projects.json' + (window.ASSET_REV ? `?rev=${window.ASSET_REV}` : ''))
  .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
  .then(data => { projects = data; boot(); })
  .catch(err => {
    console.error('Failed to load projects.json', err);
    projects = [{ id:'placeholder', title:'Hello', year:'—', hook:'Data failed to load.', linework:'' }];
    boot();
  });

function initRing() {
  const ring = document.getElementById('cardRing');
  projects.forEach((project, i) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.id = `card-${project.id}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === state.currentIndex);
    li.tabIndex = i === state.currentIndex ? 0 : -1;
    li.innerHTML = `
      <img src="${project.linework}" alt="" class="thumb" />
      <div class="card-body">
        <h3 class="card-title">${project.title}</h3>
        <p class="card-year">${project.year}</p>
        <p class="card-hook">${project.hook}</p>
      </div>`;
    ring.appendChild(li);
  });
  arrangeCards();
}

function updateCaption() {
  const cap = document.getElementById('captionText');
  const p = projects[state.currentIndex];
  if (cap && p) cap.textContent = `${p.title} · ${p.year} — ${p.hook}`;
}

function signedDistance(from, to, len){
  let d = to - from;
  if (d >  len/2) d -= len;
  if (d < -len/2) d += len;
  return d;
}

function arrangeCards() {
  const cards = Array.from(document.querySelectorAll('#cardRing .card'));
  const n = cards.length;
  if (!n) return;

  // Horizontal spacing between visible cards (responsive)
  const gap = Math.min(440, Math.max(260, window.innerWidth * 0.34)); // px
  const sideScale = 0.92;
  const sideOpacity = 0.95;

  cards.forEach((card, i) => {
    const d = signedDistance(state.currentIndex, i, n); // … -2,-1,0,+1,+2 …
    const abs = Math.abs(d);

    // Only show prev/current/next
    if (abs <= 1){
      const x = d * gap;
      const scale = d === 0 ? 1 : sideScale;
      const blur = d === 0 ? 0 : 0.5;

      card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, 0) scale(${scale})`;
      card.style.opacity = d === 0 ? 1 : sideOpacity;
      card.style.visibility = 'visible';
      card.style.filter = `blur(${blur}px)`;
      card.style.zIndex = String(1000 - abs);
      card.setAttribute('aria-selected', d === 0);
      card.tabIndex = d === 0 ? 0 : -1;
      card.style.pointerEvents = 'auto';
    } else {
      card.style.opacity = 0;
      card.style.visibility = 'hidden';
      card.style.pointerEvents = 'none';
      card.setAttribute('aria-selected', 'false');
      card.tabIndex = -1;
      card.style.transform = `translate3d(-200vw, -50%, 0) scale(${sideScale})`;
      card.style.filter = 'blur(0px)';
      card.style.zIndex = '0';
    }
  });
}

function rotate(delta){
  const n = projects.length || 0;
  if (!n) return;
  state.currentIndex = (state.currentIndex + delta + n) % n;
  arrangeCards();
  updateCaption();
}

// Recompute positions on resize
window.addEventListener('resize', arrangeCards);

// Respect reduced motion
if (state.reducedMotion) {
  document.documentElement.classList.add('reduced-motion');
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
