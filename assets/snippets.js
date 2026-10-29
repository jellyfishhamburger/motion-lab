/* Motion Lab — snippets.js
   每个 demo 的可复制代码：HTML + CSS + 必要的 JS，直接贴进任何页面即可用。 */
window.SNIPPETS = {

roll: `<!-- Rolling text button -->
<button class="btn-roll">
  <span class="roll"><span class="r-in">立即开始</span><span class="r-in" aria-hidden="true">立即开始</span></span>
  <span class="arw" aria-hidden="true">→</span>
</button>

<style>
.btn-roll{position:relative;display:inline-flex;align-items:center;gap:12px;overflow:hidden;
  padding:15px 24px;border-radius:99px;background:#f3efe4;color:#0b0c0e;font-weight:600;isolation:isolate}
.btn-roll::before{content:"";position:absolute;inset:0;background:#c8f03c;z-index:-1;
  transform:translateY(101%);transition:transform .42s cubic-bezier(.22,.68,0,1)}
.btn-roll:hover::before{transform:translateY(0)}
.roll{position:relative;display:block;overflow:hidden;height:1.5em}
.r-in{display:block;height:1.5em;line-height:1.5em;transition:transform .5s cubic-bezier(.22,.68,0,1)}
.btn-roll:hover .r-in:first-child{transform:translateY(-100%)}
.btn-roll .arw{transition:transform .42s cubic-bezier(.22,.68,0,1)}
.btn-roll:hover .arw{transform:translateX(4px) rotate(-45deg)}
</style>`,

magnetic: `<!-- Magnetic button：指针靠近时被吸过去，离开弹回 -->
<button class="btn-mag"><span>吸过来</span></button>

<style>
.btn-mag{padding:15px 26px;border-radius:99px;border:1px solid rgba(243,239,228,.2);
  background:rgba(243,239,228,.04);color:#f3efe4;font-weight:600;will-change:transform}
</style>

<script>
document.querySelectorAll('.btn-mag').forEach(btn => {
  let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
  const loop = () => {
    cx += (tx - cx) * .18; cy += (ty - cy) * .18;
    btn.style.transform = \`translate(\${cx}px,\${cy}px)\`;
    if (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1) requestAnimationFrame(loop);
    else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  btn.addEventListener('pointermove', e => {
    const r = btn.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width / 2)) * .28;
    ty = (e.clientY - (r.top + r.height / 2)) * .34;
    kick();
  });
  btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
});
</script>`,

shine: `<!-- Shine sweep：一道斜光定时扫过 -->
<button class="btn-shine"><span>领取实验包</span></button>

<style>
.btn-shine{position:relative;overflow:hidden;padding:15px 26px;border-radius:99px;
  border:1px solid rgba(255,107,74,.45);color:#f3efe4;font-weight:600;
  background:linear-gradient(180deg,rgba(255,107,74,.16),rgba(255,107,74,.04))}
.btn-shine span{position:relative;z-index:2}
.btn-shine::after{content:"";position:absolute;top:-60%;left:-40%;width:34%;height:220%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);
  transform:rotate(16deg) translateX(-120%);animation:sweep 4.2s cubic-bezier(.22,.68,0,1) infinite}
.btn-shine:hover::after{animation-duration:1.4s}
@keyframes sweep{0%,72%{transform:rotate(16deg) translateX(-120%)}100%{transform:rotate(16deg) translateX(420%)}}
</style>`,

lift: `<!-- Hover lift card -->
<a class="card-lift" href="#">
  <div class="thumb"></div>
  <h4>标题</h4>
  <p>说明文字</p>
</a>

<style>
.card-lift{display:block;border-radius:14px;overflow:hidden;background:#181a1e;
  border:1px solid rgba(243,239,228,.13);padding-bottom:14px;
  transition:transform .45s cubic-bezier(.22,.68,0,1),box-shadow .45s cubic-bezier(.22,.68,0,1)}
.card-lift .thumb{height:104px;background:linear-gradient(140deg,#c8f03c,#2a4a3d);
  transition:transform .65s cubic-bezier(.22,.68,0,1)}
.card-lift:hover{transform:translateY(-6px);box-shadow:0 26px 40px -24px rgba(0,0,0,.9)}
.card-lift:hover .thumb{transform:scale(1.07)}
</style>`,

spotlight: `<!-- Spotlight card：光跟着指针走 -->
<div class="card-spot"><h4>Spotlight</h4><p>指针经过时被一束光照亮</p></div>

<style>
.card-spot{position:relative;padding:26px 18px;border-radius:14px;overflow:hidden;
  border:1px solid rgba(243,239,228,.13);background:#181a1e;--mx:50%;--my:50%}
/* 内容少：给个最小高度，和相邻卡片齐平 */
.card-spot::before{content:"";position:absolute;inset:0;opacity:0;transition:opacity .4s;
  background:radial-gradient(220px circle at var(--mx) var(--my),rgba(200,240,60,.16),transparent 68%)}
.card-spot::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;opacity:0;
  transition:opacity .4s;pointer-events:none;
  background:radial-gradient(160px circle at var(--mx) var(--my),rgba(200,240,60,.85),transparent 65%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude}
.card-spot:hover::before,.card-spot:hover::after{opacity:1}
</style>

<script>
document.querySelectorAll('.card-spot').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});
</script>`,

clip: `<!-- Image clip reveal：滚进视口时从下往上揭开 -->
<div class="clip"><img src="photo.jpg" alt=""></div>

<style>
.clip{overflow:hidden;border-radius:14px;aspect-ratio:4/3}
.clip img{width:100%;height:100%;object-fit:cover;
  clip-path:inset(100% 0 0 0);transform:scale(1.12);
  transition:clip-path .9s cubic-bezier(.22,.68,0,1),transform 1.2s cubic-bezier(.22,.68,0,1)}
.clip.in img{clip-path:inset(0 0 0 0);transform:scale(1)}
</style>

<script>
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  io.unobserve(e.target);          // 只播一次
}), { threshold: .25 });
document.querySelectorAll('.clip').forEach(el => io.observe(el));
</script>`,

toggle: `<!-- Toggle：圆钮滑过去时拉长一下 -->
<button class="toggle" role="switch" aria-checked="false" aria-label="开关"><i></i></button>

<style>
.toggle{width:60px;height:34px;border-radius:99px;background:#181a1e;
  border:1px solid rgba(243,239,228,.13);position:relative;transition:background .35s,border-color .35s}
.toggle i{position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:99px;
  background:#a4a59c;transition:transform .42s cubic-bezier(.34,1.56,.64,1),width .22s,background .3s}
.toggle[aria-checked="true"]{background:rgba(200,240,60,.18);border-color:rgba(200,240,60,.5)}
.toggle[aria-checked="true"] i{transform:translateX(26px);background:#c8f03c}
.toggle:active i{width:32px}
</style>

<script>
document.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => {
  t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true'));
}));
</script>`,

float: `<!-- Floating label：标签缩小上浮，底线从中间展开 -->
<label class="field">
  <input type="text" placeholder=" " autocomplete="off">
  <span>邮箱 / Email</span>
</label>

<style>
.field{position:relative;display:block;max-width:230px}
.field input{width:100%;background:none;border:0;border-bottom:1px solid rgba(243,239,228,.13);
  padding:18px 0 10px;color:#f3efe4;font-size:14px;outline:none}
.field input::placeholder{color:transparent}
.field span{position:absolute;left:0;top:18px;font-size:14px;color:#a4a59c;pointer-events:none;
  transform-origin:left top;transition:transform .32s cubic-bezier(.22,.68,0,1),color .3s}
.field input:focus + span,.field input:not(:placeholder-shown) + span{
  transform:translateY(-16px) scale(.72);color:#c8f03c}
.field::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:1px;background:#c8f03c;
  transform:scaleX(0);transform-origin:center;transition:transform .42s cubic-bezier(.22,.68,0,1)}
.field:focus-within::after{transform:scaleX(1)}
</style>`,

seg: `<!-- Segmented control：滑块带弹性滑过去 -->
<div class="seg"><i class="seg-pill"></i>
  <button aria-selected="true">A</button><button>B</button><button>C</button>
</div>

<style>
.seg{position:relative;display:inline-flex;padding:4px;border-radius:99px;background:#181a1e;
  border:1px solid rgba(243,239,228,.13);font-size:12px}
.seg button{position:relative;z-index:2;padding:8px 14px;border-radius:99px;color:#a4a59c;transition:color .3s}
.seg button[aria-selected="true"]{color:#0b0c0e;font-weight:700}
.seg-pill{position:absolute;z-index:1;top:4px;left:0;height:calc(100% - 8px);border-radius:99px;
  background:#c8f03c;transition:transform .46s cubic-bezier(.34,1.56,.64,1),width .38s cubic-bezier(.22,.68,0,1)}
</style>

<script>
document.querySelectorAll('.seg').forEach(seg => {
  const pill = seg.querySelector('.seg-pill');
  const btns = [...seg.querySelectorAll('button')];
  const move = b => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + b.offsetLeft + 'px)'; };
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-selected', String(x === b)));
    move(b);
  }));
  move(btns[0]);
});
</script>`,

split: `<!-- Hero 逐字升起（含错开） -->
<h1 class="split" data-split>把 327 个动效拧成 12 个</h1>

<style>
.split .w{display:inline-block;overflow:hidden;vertical-align:top}
.split .c{display:inline-block;transform:translateY(112%);
  transition:transform .7s cubic-bezier(.22,.68,0,1)}
.split.in .c{transform:translateY(0)}
</style>

<script>
document.querySelectorAll('[data-split]').forEach(el => {
  const text = el.textContent.trim();
  el.textContent = '';
  [...text].forEach((ch, i) => {
    const w = document.createElement('span'); w.className = 'w';
    const c = document.createElement('span'); c.className = 'c';
    c.textContent = ch === ' ' ? '\\u00A0' : ch;
    c.style.transitionDelay = (i * 34) + 'ms';
    w.appendChild(c); el.appendChild(w);
  });
  requestAnimationFrame(() => el.classList.add('in'));
});
</script>`,

countup: `<!-- 数字累加：滚动进视口才开始数 -->
<div class="stat"><b data-count="327">0</b><span>个动效来源</span></div>

<script>
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, target = Number(el.dataset.count), t0 = performance.now();
  const tick = t => {
    const p = Math.min((t - t0) / 900, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  io.unobserve(el);
}), { threshold: .6 });
document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
</script>`,

tuner: `/* 三个旋钮：全站动画时长乘 var(--mo)，间距乘 var(--dens) */
:root{--mo:1;--dens:1;--radius:18px}

.my-section{padding:calc(80px * var(--dens)) 0}
.my-card{border-radius:var(--radius);
  transition:transform calc(450ms * var(--mo)) cubic-bezier(.22,.68,0,1)}

/* JS 侧同样按密度取时长 */
const mo = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mo')) || 1;
const DUR = 900 * mo();

/* 尊重系统设置：开了「减少动态效果」就整站关掉动画 */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms !important;transition-duration:.001ms !important}
}`
};
