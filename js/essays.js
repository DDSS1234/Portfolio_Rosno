document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('[data-essay-list]');
  if (!list) {
    return;
  }

  const emptyState = list.querySelector('[data-essay-empty]');
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  function showEmpty(message) {
    if (!emptyState) {
      return;
    }

    if (message) {
      emptyState.textContent = message;
    }

    emptyState.hidden = false;
  }

  function hideEmpty() {
    if (emptyState) {
      emptyState.hidden = true;
    }
  }

  function renderEssayCard(essay) {
    const article = document.createElement('article');
    article.className = 'essay-card';

    const title = document.createElement('h3');
    title.className = 'essay-card__title';

    if (essay.url) {
      const link = document.createElement('a');
      link.className = 'essay-card__link';
      link.href = essay.url;
      link.textContent = essay.title;
      title.appendChild(link);
    } else {
      title.textContent = essay.title;
    }

    article.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'essay-card__meta';

    const publishedDate = new Date(essay.publishedAt);
    if (!Number.isNaN(publishedDate.valueOf())) {
      const time = document.createElement('time');
      time.className = 'essay-card__time';
      time.dateTime = essay.publishedAt;
      time.textContent = dateFormatter.format(publishedDate);
      meta.appendChild(time);
    }

    if (essay.updatedAt) {
      const updatedDate = new Date(essay.updatedAt);
      if (!Number.isNaN(updatedDate.valueOf())) {
        const updated = document.createElement('span');
        updated.className = 'essay-card__updated';
        const time = document.createElement('time');
        time.dateTime = essay.updatedAt;
        time.textContent = dateFormatter.format(updatedDate);
        updated.append('Updated ', time);
        meta.appendChild(updated);
      }
    }

    if (meta.childNodes.length > 0) {
      article.appendChild(meta);
    }

    if (essay.summary) {
      const summary = document.createElement('p');
      summary.className = 'essay-card__summary';
      summary.textContent = essay.summary;
      article.appendChild(summary);
    }

    return article;
  }

  fetch('data/essays.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load essays: ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      const essays = Array.isArray(data)
        ? data
        : data && Array.isArray(data.essays)
        ? data.essays
        : [];

      const validEssays = essays.filter(
        (essay) =>
          essay && typeof essay.title === 'string' && typeof essay.publishedAt === 'string',
      );

      if (!validEssays.length) {
        showEmpty('Essays will live here soon. Check back for fresh notes.');
        return;
      }

      hideEmpty();

      validEssays
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .forEach((essay) => {
          const card = renderEssayCard(essay);
          if (card) {
            list.appendChild(card);
          }
        });
    })
    .catch((error) => {
      console.error(error);
      showEmpty('Unable to load essays right now. Please try again later.');
    });
});
