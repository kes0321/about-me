(() => {
  const size = 9, mines = 10;
  const board = document.querySelector('#mine-board');
  const result = document.querySelector('#mine-result');
  function showResult(message, won) {
    result.textContent = message;
    if (won) {
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      const time = document.createElement('span');
      time.className = 'mine-result-time';
      time.textContent = `소요 시간: ${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
      result.append(time);
    }
    result.classList.toggle('is-win', won);
    result.hidden = false;
  }
  let cells, started, ended, startedAt;
  function neighbors(i) {
    const result = [];
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      const row = Math.floor(i / size) + y, col = i % size + x;
      if ((x || y) && row >= 0 && row < size && col >= 0 && col < size) result.push(row * size + col);
    }
    return result;
  }
  function draw() {
    cells.forEach((c, i) => {
      const b = board.children[i];
      b.textContent = c.open ? (c.mine ? '💣' : c.count || '') : c.flag ? '🚩' : '';
      b.className = 'mine-cell' + (c.open ? ' is-open' : '') + (c.open && c.mine ? ' is-mine' : '');
      b.dataset.count = c.count;
      b.disabled = ended || c.open;
      b.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${i % size + 1}열, ${c.open ? c.mine ? '지뢰' : '주변 지뢰 ' + c.count + '개' : c.flag ? '깃발' : '닫힌 칸'}`);
    });
  }
  function play(i, flag) {
    const c = cells[i];
    if (ended || c.open) return;
    if (flag) {
      if (!c.flag && cells.filter(c => c.flag).length >= mines) return;
      c.flag = !c.flag;
    } else {
      if (c.flag) return;
      if (!started) {
        startedAt = performance.now();
        const safe = new Set([i, ...neighbors(i)]);
        const candidates = cells.map((_, j) => j).filter(j => !safe.has(j));
        for (let n = 0; n < mines; n++) {
          const pick = Math.floor(Math.random() * candidates.length);
          cells[candidates.splice(pick, 1)[0]].mine = true;
        }
        cells.forEach((c, j) => c.count = neighbors(j).filter(k => cells[k].mine).length);
        started = true;
      }
      if (c.mine) {
        cells.forEach(c => { if (c.mine) c.open = true; });
        ended = true;
        showResult('저런..', false);
      } else {
        const queue = [i];
        while (queue.length) {
          const j = queue.pop(), next = cells[j];
          if (next.open || next.flag || next.mine) continue;
          next.open = true;
          if (!next.count) queue.push(...neighbors(j));
        }
        if (cells.filter(c => c.open).length === size * size - mines) {
          ended = true;
          showResult('🎉 정말 대단해요', true);
        }
      }
    }
    draw();
  }
  function reset() {
    cells = Array.from({length: size * size}, () => ({mine: false, open: false, flag: false, count: 0}));
    started = ended = false;
    startedAt = null;
    result.hidden = true;
    result.textContent = '';
    board.replaceChildren(...cells.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => play(i, false));
      b.addEventListener('contextmenu', e => { e.preventDefault(); play(i, true); });
      return b;
    }));
    draw();
  }
  document.querySelector('#mine-reset').addEventListener('click', reset);
  reset();
})();
