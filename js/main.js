const catalog = document.getElementById('catalog');

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
}

fetch('data/projects.json')
  .then(response => response.json())
  .then(data => renderProjects(data))
  .catch(error => {
    console.error('Failed to load projects', error);
  });
