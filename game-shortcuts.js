(() => {
  const screens = ['.intro-screen', '.mine-screen', '.tiles-screen'].map(selector => document.querySelector(selector));
  const markers = [...document.querySelectorAll('.game-shortcuts button')];
  let current = 0, scheduled = false;
  function update() {
    scheduled = false;
    let distance = Infinity;
    screens.forEach((screen, i) => {
      const rect = screen.getBoundingClientRect();
      const delta = Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
      if (delta < distance) { distance = delta; current = i; }
    });
    markers.forEach((marker, i) => {
      if (i === current) marker.setAttribute('aria-current', 'page');
      else marker.removeAttribute('aria-current');
    });
  }
  markers.forEach((marker, i) => marker.addEventListener('click', () => {
    screens[i].scrollIntoView({block: 'start'});
  }));
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, {passive: true});
  window.addEventListener('resize', update);
  update();
})();
