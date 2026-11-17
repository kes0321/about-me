(() => {
  const board = document.querySelector('#tile-board');
  const result = document.querySelector('#tile-result');
  let tiles, score, best = 0, won, ended, touch, moving = false, generation = 0;
  try { best = Number(localStorage.getItem('about-me-2048-best')) || 0; } catch {}
  function spawn() {
    const empty = tiles.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) return;
    const index = empty[Math.floor(Math.random() * empty.length)];
    tiles[index] = Math.random() < .9 ? 2 : 4;
    return index;
  }
  function render() {
    board.replaceChildren(...tiles.map(value => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.value = value;
      tile.textContent = value || '';
      tile.setAttribute('aria-label', value ? String(value) : '빈 칸');
      if (value) tile.style.background = `hsl(${Math.max(15, 48 - Math.log2(value) * 3)} 78% ${Math.max(40, 93 - Math.log2(value) * 5)}%)`;
      return tile;
    }));
    document.querySelector('#tile-score').textContent = score;
    document.querySelector('#tile-best').textContent = best;
  }
  async function move(direction) {
    if (ended || moving) return;
    const before = tiles.join(',');
    const movements = [], merges = [];
    for (let line = 0; line < 4; line++) {
      const indices = Array.from({length: 4}, (_, n) => {
        if (direction === 'left') return line * 4 + n;
        if (direction === 'right') return line * 4 + 3 - n;
        if (direction === 'up') return n * 4 + line;
        return (3 - n) * 4 + line;
      });
      const sources = indices.filter(i => tiles[i]);
      const values = sources.map(i => tiles[i]), merged = [];
      for (let n = 0; n < values.length; n++) {
        const destination = indices[merged.length];
        movements.push([sources[n], destination]);
        if (values[n] === values[n + 1]) {
          movements.push([sources[n + 1], destination]);
          merges.push(destination);
          merged.push(values[n] * 2);
          score += values[n] * 2;
          n++;
        } else merged.push(values[n]);
      }
      indices.forEach((i, n) => tiles[i] = merged[n] || 0);
    }
    if (before === tiles.join(',')) return;
    moving = true;
    const currentGeneration = generation;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animations = movements.map(([from, to]) => {
      const element = board.children[from];
      const start = element.getBoundingClientRect();
      const target = board.children[to].getBoundingClientRect();
      element.style.zIndex = '2';
      return element.animate([
        {transform: 'translate(0, 0)'},
        {transform: `translate(${target.left - start.left}px, ${target.top - start.top}px)`}
      ], {duration: reduced ? 0 : 150, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards'});
    });
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
    if (generation !== currentGeneration) return;
    const spawned = spawn();
    if (score > best) {
      best = score;
      try { localStorage.setItem('about-me-2048-best', String(best)); } catch {}
    }
    if (!won && tiles.includes(2048)) {
      won = true;
    }
    ended = tiles.every((v, i) => v && (i % 4 === 3 || v !== tiles[i + 1]) && (i >= 12 || v !== tiles[i + 4]));
    if (ended) {
      result.textContent = won ? '🎉 2048 달성!' : '게임 종료';
      result.classList.toggle('is-win', won);
      result.hidden = false;
    }
    render();
    if (!reduced) {
      merges.forEach(i => board.children[i].animate([
        {transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'scale(1)'}
      ], {duration: 160}));
      if (spawned !== undefined) board.children[spawned].animate([
        {transform: 'scale(.5)', opacity: 0}, {transform: 'scale(1)', opacity: 1}
      ], {duration: 140});
    }
    moving = false;
  }
  board.addEventListener('keydown', e => {
    const direction = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'}[e.key];
    if (direction) { e.preventDefault(); move(direction); }
  });
  board.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    board.focus();
    touch = {x: e.clientX, y: e.clientY};
    board.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointerup', e => {
    if (!touch) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
  });
  board.addEventListener('pointercancel', () => touch = null);
  function reset() {
    generation++;
    moving = false;
    [...board.children].forEach(tile => tile.getAnimations().forEach(animation => animation.cancel()));
    tiles = Array(16).fill(0);
    score = 0; won = ended = false; touch = null;
    spawn(); spawn(); render();
    result.hidden = true;
    result.textContent = '';
  }
  document.querySelector('#tile-reset').addEventListener('click', reset);
  reset();
})();
