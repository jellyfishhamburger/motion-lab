/* Motion Lab — motion.js
   全部原生：IntersectionObserver + pointer 事件 + 一点数学。没有任何依赖。 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,.68,0,1)';

  /* ---------- 0. 全局强度：读 CSS 变量，供 JS 里算时长 ---------- */
  const mo = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mo')) || 1;

  /* ---------- 1. 逐字拆分（Hero 标题） ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.textContent = '';
    [...text].forEach(ch => {
      if (ch === '|') { el.appendChild(document.createElement('br')); return; }  // '|' = 强制换行
      const w = document.createElement('span');
      w.className = 'w';
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch === ' ' ? '\u00A0' : ch;
      w.appendChild(c);
      el.appendChild(w);
    });
    // 逐字错开
    [...el.querySelectorAll('.c')].forEach((c, i) => {
      c.style.transitionDelay = `${i * 34}ms`;
    });
  });

  /* ---------- 2. 吸顶导航收缩 + 阅读进度 ---------- */
  const hdr = document.getElementById('hdr');
  const prog = document.getElementById('prog');
  let raf = null;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const y = scrollY;
      hdr.classList.toggle('scrolled', y > 40);
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${h > 0 ? Math.min(y / h, 1) : 0})`;
      prog.style.width = '100%';
      raf = null;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 进场：IntersectionObserver ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      // 同组错开：用组内序号做 delay
      const idx = el.dataset.stagger ? Number(el.dataset.stagger) : 0;
      el.style.transitionDelay = reduce ? '0ms' : `${idx * 80}ms`;
      el.classList.add('in');
      io.unobserve(el);          // 只播一次
    });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.stagger = i % 4;
    io.observe(el);
  });
  document.querySelectorAll('.card-clip').forEach(el => io.observe(el));
  // hero 立刻进场
  requestAnimationFrame(() => document.querySelector('.hero')?.classList.add('in'));

  /* ---------- 4. 数字累加 ---------- */
  const countIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 900 * mo();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIo.unobserve(el);
    });
  }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => countIo.observe(el));

  /* ---------- 5. 磁吸按钮 ---------- */
  document.querySelectorAll('.btn-mag').forEach(btn => {
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    const loop = () => {
      cx += (tx - cx) * .18;
      cy += (ty - cy) * .18;
      btn.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
      if (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1) requestAnimationFrame(loop);
      else { btn.style.transform = `translate(${tx}px,${ty}px)`; running = false; }
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    btn.addEventListener('pointermove', (e) => {
      if (reduce) return;
      const r = btn.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * .28 * mo();
      ty = (e.clientY - (r.top + r.height / 2)) * .34 * mo();
      kick();
    });
    btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  });

  /* ---------- 6. 聚光卡片：把指针坐标写进 CSS 变量 ---------- */
  document.querySelectorAll('.card-spot').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- 7. 开关 ---------- */
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      const on = t.getAttribute('aria-checked') === 'true';
      t.setAttribute('aria-checked', String(!on));
      const label = t.parentElement.querySelector('.tg-state');
      if (label) label.textContent = on ? '关' : '开';
    });
  });

  /* ---------- 8. 分段控件：滑块跟随 ---------- */
  document.querySelectorAll('.seg').forEach(seg => {
    const pill = seg.querySelector('.seg-pill');
    const btns = [...seg.querySelectorAll('button')];
    const move = (btn) => {
      pill.style.width = `${btn.offsetWidth}px`;
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-selected', String(x === b)));
      move(b);
      // 顺便联动动效强度，让这个控件真的有用
      const map = { '强度低': .5, '中': 1, '高': 1.75 };
      setMo(map[b.textContent.trim()] ?? 1);
    }));
    // 初始化（等字体落位）
    requestAnimationFrame(() => move(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]));
    addEventListener('resize', () => move(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]));
  });

  /* ---------- 9. 三个旋钮 ---------- */
  const root = document.documentElement;
  const sMo = document.getElementById('t-mo');
  const sDens = document.getElementById('t-dens');
  const sRad = document.getElementById('t-rad');
  const oMo = document.getElementById('o-mo');
  const oDens = document.getElementById('o-dens');
  const oRad = document.getElementById('o-rad');
  const code = document.getElementById('t-code');

  function setMo(v) {
    root.style.setProperty('--mo', v);
    if (sMo) sMo.value = v;
    if (oMo) oMo.textContent = Number(v).toFixed(2).replace(/0$/, '') + '×';
    sync();
  }
  function setDens(v) {
    root.style.setProperty('--dens', v);
    if (oDens) oDens.textContent = Number(v).toFixed(1) + '×';
    sync();
  }
  function setRad(v) {
    root.style.setProperty('--radius', v + 'px');
    if (oRad) oRad.textContent = v + 'px';
    sync();
  }
  function sync() {
    if (!code) return;
    const cs = getComputedStyle(root);
    code.textContent = `--mo:${(+cs.getPropertyValue('--mo')).toFixed(2)}; --dens:${(+cs.getPropertyValue('--dens')).toFixed(2)}; --radius:${cs.getPropertyValue('--radius').trim()};`;
  }
  sMo?.addEventListener('input', e => setMo(e.target.value));
  sDens?.addEventListener('input', e => setDens(e.target.value));
  sRad?.addEventListener('input', e => setRad(e.target.value));
  document.getElementById('t-reset')?.addEventListener('click', () => { setMo(1); setDens(1); setRad(18); });
  sync();

  /* ---------- 10. 一键复制代码 ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 1600);
  }
  async function copyText(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      return 'ok';
    } catch { /* 继续用老办法 */ }
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    // 两条路都不行：把代码塞进底部提示条，让用户自己 Ctrl+C
    if (!ok) {
      let bar = document.getElementById('fallback');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'fallback';
        bar.innerHTML = '<b>按 Ctrl/Cmd + C 复制</b><textarea readonly></textarea><button type="button" aria-label="关闭">×</button>';
        bar.querySelector('button').addEventListener('click', () => bar.remove());
        document.body.appendChild(bar);
      }
      const box = bar.querySelector('textarea');
      box.value = txt;
      box.focus();
      box.select();
    }
    return ok ? 'ok' : 'manual';
  }
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.copy;
      const code = window.SNIPPETS?.[key];
      if (!code) { showToast('这段还没写好'); return; }
      const res = await copyText(code);
      showToast(res === 'ok' ? `已复制 ${key}` : res === 'manual' ? '已选中，按 Ctrl / Cmd + C' : '复制失败');
    });
  });
})();
