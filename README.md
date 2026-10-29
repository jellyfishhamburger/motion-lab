# Motion Lab 动效实验台

从 327 个网页动效里筛出 12 个能上生产的，做成一个可调强度、可一键复制代码的页面。
**零依赖**：纯 HTML / CSS / JS，没有 GSAP、没有 npm、没有构建步骤。双击 `index.html` 就能跑。

```
MotionLab/
├─ index.html          页面结构（5 个区块）
├─ assets/
│  ├─ site.css         全部样式 + 12 个动效实现 + 响应式 + reduced-motion
│  ├─ motion.js        SplitText / IntersectionObserver / 磁吸 / 滑块 / 复制
│  └─ snippets.js      每个 demo 的可复制代码片段
└─ tools/
   └─ cdp.py           用真实 Chrome（CDP）跑一遍并截图自检
```

## 12 个动效清单

| # | 效果 | 组件 | 原理 | 适合放哪 |
|---|---|---|---|---|
| 1 | Rolling Text 文字上翻 | 按钮 | 文字复制一层，hover 时两层一起 translateY | 主 CTA |
| 2 | Magnetic 磁吸 | 按钮 | pointermove 算与中心的偏移 ×0.3，rAF 缓动回位 | 主 CTA、圆图标 |
| 3 | Shine Sweep 扫光 | 按钮 | 伪元素斜向渐变 + 定时 keyframes | 次要 CTA |
| 4 | Hover Lift 浮起 | 卡片 | translateY + 阴影过渡 + 缩图 scale | 任何卡片列表 |
| 5 | Spotlight 聚光 | 卡片 | 指针坐标写进 `--mx/--my`，radial-gradient 跟随 | 深色区、功能卡 |
| 6 | Clip Reveal 揭开 | 图片 | `clip-path: inset(100% 0 0 0)` → `inset(0)` | Hero 图、案例图 |
| 7 | Split Reveal 逐字 | 标题 | 每个字包 `overflow:hidden`，内层 translateY(112%) | Hero 大标题 |
| 8 | Stagger 错开进场 | 列表/卡片 | IntersectionObserver + 每条 `transition-delay: i*80ms` | 首屏以下所有内容 |
| 9 | Count Up 数字累加 | 数据 | rAF + easeOutCubic，滚进视口才开始 | 数据区、成绩、统计 |
| 10 | Toggle 开关 | 控件 | `aria-checked` 驱动，`:active` 时圆钮变宽（拉长手感） | 设置项 |
| 11 | Floating Label 浮动标签 | 表单 | `placeholder=" "` + `:not(:placeholder-shown)` | 登录、留言 |
| 12 | Segmented 分段 | 控件 | 绝对定位滑块，JS 读 offsetLeft/offsetWidth | 分类、筛选 |

## 三个旋钮（真在生效）

```css
:root{ --mo:1; --dens:1; --radius:18px }
transition: transform calc(450ms * var(--mo)) …;
padding: calc(80px * var(--dens));
```

JS 侧取值：`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mo'))`。
面板右下角的代码行会实时输出当前值，直接抄回 CSS。

## 自检

```bash
python tools/cdp.py "file:///C:/Users/22390/Desktop/MotionLab/index.html" "C:/Users/22390/AppData/Local/Temp/ml"
```

会打印：页面高度、横向溢出（必须是 0）、拆分字数、进场元素数、数字累加的最终值、进度条，
并按桌面 1440 / 手机 390 两个宽度截图。

## 三条上线纪律

1. **只动 transform / opacity / clip-path**，不碰 width、top、margin——否则每帧重排。
2. **进场只播一次**：`io.unobserve(el)`，回滚到视口不重播。
3. **认 `prefers-reduced-motion`**：系统开了减少动态效果，整页动画降为 0.001ms（已在 site.css 末尾）。

## 来源与版权

- kittenjam Motion Library：327 条动效目录，看场景分类和提示词描述很有用；站点自述"仅供个人参考学习"，代码是重写的。
- Remotion：React 生成视频，产出 mp4/gif，不是网页交互动效的替代品。
- Taste Skill：建站时的设计规范（排版 / 动效 / 密度三参数），不是运行时库。
