(function () {
  const menuButton = document.getElementById('menuBtn');
  const siteMenu = document.getElementById('siteMenu');
  let menuHideTimeout = null;

  if (!menuButton || !siteMenu) {
    return;
  }

  function setMenuOpen(isOpen) {
    if (menuHideTimeout !== null) {
      window.clearTimeout(menuHideTimeout);
      menuHideTimeout = null;
    }

    menuButton.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      siteMenu.hidden = false;
      siteMenu.dataset.open = 'true';
      document.documentElement.classList.add('menu-open');
      document.body.classList.add('menu-open');
    } else {
      siteMenu.dataset.open = 'false';
      document.documentElement.classList.remove('menu-open');
      document.body.classList.remove('menu-open');

      menuHideTimeout = window.setTimeout(() => {
        if (!siteMenu) return;
        siteMenu.hidden = true;
        menuHideTimeout = null;
      }, 400);
    }
  }

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
    }
  });

  siteMenu.addEventListener('click', (event) => {
    if (event.target === siteMenu) {
      setMenuOpen(false);
    }
  });

  const menuLinks = siteMenu.querySelectorAll('a, button');
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
})();
