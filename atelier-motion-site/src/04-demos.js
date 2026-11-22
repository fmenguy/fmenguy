/* ---------- gabarits de démonstration : mêmes constantes que le prompt ---------- */
// Aides partagées, sérialisables pour l'export autonome (chaque fonction est indépendante).
const H = {
  clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
  lerp: (a, b, t) => a + (b - a) * t,
  eo: t => 1 - Math.pow(1 - t, 3),
  eio: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  zoom: el => { const w = el.offsetWidth; return w ? el.getBoundingClientRect().width / w : 1; },
  portrait: el => el.offsetWidth < el.offsetHeight,
  price: s => parseFloat(String(s).replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
  money: (n, like) => (Math.round(n * 100) / 100).toString().replace(".", ",") + (String(like).replace(/[\d.,\s]/g, "") ? " " + String(like).replace(/[\d.,\s]/g, "") : ""),
  bump: el => { if (el && el.animate) el.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" }); },
  pad: n => String(n).padStart(2, "0")
};

const u = {
  c: n => `calc(${n} * var(--c))`, s: n => `calc(${n} * var(--s))`,
  fc: n => `max(9px, calc(${n} * var(--c)))`, fs: n => `max(9px, calc(${n} * var(--s)))`
};

function demoConfig(st, res) {
  const A = ARCH[st.arch], sp = st.assets.sprite;
  const pos = c => (sp.cols > 1 ? pct(c.col / (sp.cols - 1) * 100) : "0%") + " " + (sp.rows > 1 ? pct(c.row / (sp.rows - 1) * 100) : "0%");
  const wd = Math.max(...(st.fonts.display.weights.length ? st.fonts.display.weights : [700]));
  return {
    arch: st.arch, K: A.K, brand: st.brand.name || "Marque", copy: st.copy, inter: eff(st), tokens: st.tokens, rm: false,
    fd: fontStack(st.fonts.display.family), fb: fontStack(st.fonts.body.family), wd, fontsURL: fontsURL(st.fonts),
    meta: st.meta, cols: sp.cols, rows: sp.rows, sprite: res.sprite,
    items: st.items.map(it => ({ name: it.name, tag: it.tag, price: it.price, desc: it.desc, colors: (it.colors.length ? it.colors : [{ name: "", hex: "#888888", col: 0, row: 0 }]).map(c => ({ name: c.name, hex: c.hex, pos: pos(c) })) })),
    images: res.images || [],
    tryon: st.arch === "tryon" ? { slots: st.tryon.slots, looks: st.tryon.looks, photos: res.photos, masks: res.masks, w: res.tw, h: res.th, room: res.room } : null
  };
}

function demoCSS(C, inline) {
  const { c, s, fc, fs } = u;
  let css = `
.frame{position:relative;width:100%;height:100%;overflow:hidden;container-type:size}
.page{position:absolute;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--fb);font-size:14px;line-height:1.3;--c:calc(100VW / 1440);--s:min(calc(100VW / 1440),calc(100VH / 900));--fw:1440;--fh:900;-webkit-font-smoothing:antialiased;-webkit-user-select:none;user-select:none}
.page *{box-sizing:border-box;margin:0}
.page button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;letter-spacing:inherit;text-transform:inherit}
.page input{font:inherit;color:inherit}
.page :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.defs{position:absolute;width:0;height:0}
.logo{position:absolute;left:${c(40)};top:${c(30)};font-family:var(--fd);font-weight:var(--wd);font-size:max(14px,${c(22)});letter-spacing:.02em;text-transform:uppercase;line-height:1;z-index:300;color:var(--text);text-decoration:none}
.nav{position:absolute;left:50%;top:${c(36)};transform:translateX(-50%);display:flex;gap:${c(36)};z-index:300}
.nav a{font-size:${fc(12)};font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);text-decoration:none}
.cart{position:absolute;right:${c(40)};top:${c(26)};display:flex;align-items:center;gap:${c(10)};font-size:${fc(12)};font-weight:500;letter-spacing:.08em;text-transform:uppercase;z-index:300}
.count{display:grid;place-items:center;min-width:max(18px,${c(24)});height:max(18px,${c(24)});border-radius:99px;background:var(--accent);color:var(--bg);font-size:${fc(11)};font-weight:600;letter-spacing:0;padding:0 5px}
.foot{position:absolute;left:${c(40)};right:${c(40)};bottom:${c(26)};display:flex;justify-content:space-between;gap:12px;font-size:${fc(11)};letter-spacing:.06em;text-transform:uppercase;color:var(--text2);z-index:300;pointer-events:none}
.scene{position:absolute;left:50%;top:50%;width:calc(var(--fw) * var(--s));height:calc(var(--fh) * var(--s));transform:translate(-50%,-50%)}
.page .spr{background-image:var(--sprite);background-size:${C.cols * 100}% ${C.rows * 100}%;background-repeat:no-repeat;filter:url(#alpha-clean)}
.head{position:absolute;left:${s(60)};top:${s(118)};z-index:2;pointer-events:none}
.head h1{font-family:var(--fd);font-weight:var(--wd);font-size:${fs(20)};letter-spacing:.04em;text-transform:uppercase;line-height:1.1}
.head p{font-size:${fs(14)};color:var(--text2);margin-top:${s(6)}}
.sw{display:flex;gap:${s(10)}}
.dot{width:max(18px,${s(28)});height:max(18px,${s(28)});border-radius:50%;border:1px solid var(--line)!important;position:relative}
.dot[aria-checked="true"]::after{content:"";position:absolute;inset:-5px;border:1.5px solid var(--text);border-radius:50%}
.cta{display:inline-flex;align-items:center;justify-content:center;height:max(34px,${s(52)});padding:0 ${s(28)}!important;background:var(--text)!important;color:var(--bg)!important;font-size:${fs(13)};font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.cta:hover{background:var(--accent)!important}
.pill{display:inline-flex;align-items:center;height:max(26px,${s(36)});padding:0 ${s(16)}!important;border:1px solid var(--line)!important;border-radius:99px;font-size:${fs(12)};font-weight:500;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;background:var(--bg)!important}
.pill[aria-pressed="true"]{border-color:var(--text)!important;background:var(--text)!important;color:var(--bg)!important}
.fly{position:absolute;left:0;top:0;z-index:400;pointer-events:none}
MQP{
.page{--c:calc(100VW / 390);--s:min(calc(100VW / 390),calc(100VH / 844));--fw:390;--fh:844}
.nav{display:none}
.logo{left:${c(20)};top:${c(22)}}
.cart{right:${c(20)};top:${c(18)}}
.foot{left:${c(20)};right:${c(20)};bottom:${c(16)}}
.foot span:last-child{display:none}
.head{left:${s(20)};top:${s(70)}}
}`;
  css += DEMOS[C.arch].css(C);
  css = css.replace(/MQP\{/g, inline ? "@container (orientation: portrait){" : "@media (orientation: portrait){");
  return css.replace(/100VW/g, inline ? "100cqw" : "100vw").replace(/100VH/g, inline ? "100cqh" : "100vh");
}
function chromeHTML(C) {
  const k = C.copy;
  return `<svg class="defs" aria-hidden="true"><filter id="alpha-clean" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.1" intercept="-0.1"/></feComponentTransfer></filter></svg>
<a class="logo" href="#" aria-label="${esc(C.brand)}, accueil">${esc(C.brand)}</a>
<nav class="nav" aria-label="Navigation principale">${[k.nav1, k.nav2, k.nav3].filter(Boolean).map(n => `<a href="#">${esc(n)}</a>`).join("")}</nav>
${C.inter.cart ? `<button class="cart" type="button" aria-label="${esc(k.cart)}">${esc(k.cart)} <span class="count" aria-live="polite">0</span></button>` : ""}
<div class="foot"><span>${esc(k.hint)}</span><span>${esc(k.footer)}</span></div>`;
}
function pageStyle(C) {
  const t = C.tokens;
  return `--bg:${t.bg};--text:${t.text};--text2:${t.text2};--line:${t.line};--ghost:${t.ghost};--accent:${t.accent};--fd:${C.fd.replace(/"/g, "'")};--fb:${C.fb.replace(/"/g, "'")};--wd:${C.wd};--sprite:url('${C.sprite}')`;
}
function demoHTML(C) {
  return `<div class="page ${C.arch}" style="${pageStyle(C)}">${chromeHTML(C)}${DEMOS[C.arch].html(C)}</div>`;
}
const swHTML = (it, i) => `<div class="sw" role="radiogroup" aria-label="Coloris">${it.colors.map((c, j) => `<button type="button" class="dot" role="radio" aria-checked="${j === 0}" aria-label="${esc(c.name)}" data-i="${i}" data-j="${j}" style="background:${c.hex}"></button>`).join("")}</div>`;

const DEMOS = {};

/* a. Anneau rotatif */
DEMOS.ring = {
  css(C) {
    const { s, fs } = u, L = C.K.L, P = C.K.P;
    return `
.ring{--S0:${L.S0}}
.ring .scene{touch-action:pan-y;cursor:grab}
.ring .ghost{position:absolute;left:50%;top:${s(430)};transform:translate(-50%,-50%);font-family:var(--fd);font-weight:var(--wd);font-size:${s(330)};line-height:1;letter-spacing:-.04em;color:var(--ghost);white-space:nowrap;pointer-events:none}
.ring .piece{position:absolute;left:0;top:0;width:calc(var(--S0) * var(--s));height:calc(var(--S0) * var(--s));will-change:transform;border-radius:8px}
.ring .cap{position:absolute;left:50%;top:${s(690)};transform:translateX(-50%);text-align:center;white-space:nowrap;pointer-events:none}
.ring .cap b{display:block;font-family:var(--fd);font-weight:var(--wd);font-size:max(13px,${s(26)});letter-spacing:-.01em}
.ring .cap span{font-size:${fs(14)};color:var(--text2);letter-spacing:.04em}
.ring .pv{position:absolute;left:${s(800)};top:${s(200)};width:${s(500)};display:flex;flex-direction:column;align-items:flex-start;gap:${s(18)};opacity:0;z-index:250;cursor:default}
.ring .pv .tag{font-size:${fs(11)};letter-spacing:.1em;text-transform:uppercase;color:var(--text2)}
.ring .pv h2{font-family:var(--fd);font-weight:var(--wd);font-size:max(22px,${s(64)});line-height:.95;letter-spacing:-.02em}
.ring .pv .desc{font-size:max(11px,${s(16)});color:var(--text2);max-width:${s(400)};line-height:1.45}
.ring .pv .price{font-family:var(--fd);font-weight:var(--wd);font-size:max(14px,${s(28)})}
.ring .pv .back{font-size:${fs(12)};letter-spacing:.06em;text-transform:uppercase;text-decoration:underline;text-underline-offset:4px;color:var(--text2)}
MQP{
.ring{--S0:${P.S0}}
.ring .ghost{top:${s(330)};font-size:${s(120)}}
.ring .cap{top:${s(470)}}
.ring .pv{left:${s(24)};top:${s(410)};width:${s(342)};gap:${s(12)}}
.ring .pv h2{font-size:${s(36)}}
.ring .pv .desc{font-size:${s(14)};max-width:none}
.ring .pv .price{font-size:${s(20)}}
.ring .cta{height:${s(46)};font-size:${s(12)}}
.ring .dot{width:${s(26)};height:${s(26)}}
}`;
  },
  html(C) {
    const k = C.copy;
    return `<div class="scene" role="group" aria-roledescription="carrousel" aria-label="${esc(k.title)}">
<div class="ghost" aria-hidden="true">${esc(k.ghost)}</div>
<div class="head"><h1>${esc(k.title)}</h1><p>${esc(k.subtitle)}</p></div>
${C.items.map((it, i) => `<button type="button" class="piece spr" data-i="${i}" aria-label="${esc(it.name)}, ${esc(it.price)}" style="background-position:${it.colors[0].pos}"></button>`).join("")}
<div class="cap" aria-live="polite"><b></b><span></span></div>
<section class="pv" role="dialog" aria-modal="false" aria-labelledby="pv-name" inert>
<span class="tag"></span><h2 id="pv-name"></h2><p class="desc"></p><span class="price"></span>
${C.inter.swatches ? `<div class="swbox"></div>` : ""}
${C.inter.cart ? `<button type="button" class="cta add">${esc(k.cta)}</button>` : ""}
<button type="button" class="back">${esc(k.back)}</button>
</section></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, N = C.items.length, RM = C.rm, TAU = Math.PI * 2;
    const scene = root.querySelector(".scene"), pieces = [...root.querySelectorAll(".piece")], pv = root.querySelector(".pv"), cap = root.querySelector(".cap");
    const cartEl = root.querySelector(".cart"), countEl = root.querySelector(".count"), page = root.querySelector(".page");
    let th = 0, v = RM ? 0 : K.OMEGA, vs = 0, d = 0, dFrom = 0, dTo = 0, dT0 = 0, dDur = 1, sel = -1, drag = null, moved = 0, front = -1, count = 0, snap = null, hovI = -1;
    let last = performance.now(); const t0 = last, hov = pieces.map(() => 0), col = pieces.map(() => 0);
    const geo = () => { const g = H.portrait(frame) ? K.P : K.L; return { g, s: scene.offsetWidth / g.FW }; };
    function fillPV(i) {
      const it = C.items[i];
      pv.querySelector(".tag").textContent = it.tag; pv.querySelector("h2").textContent = it.name; pv.querySelector(".desc").textContent = it.desc; pv.querySelector(".price").textContent = it.price;
      const box = pv.querySelector(".swbox");
      if (box) {
        box.innerHTML = '<div class="sw" role="radiogroup" aria-label="Coloris">' + it.colors.map((c, j) => '<button type="button" class="dot" role="radio" aria-checked="' + (j === col[i]) + '" aria-label="' + c.name.replace(/"/g, "") + '" data-j="' + j + '" style="background:' + c.hex + '"></button>').join("") + "</div>";
        box.querySelectorAll(".dot").forEach(b => b.addEventListener("click", () => {
          col[i] = +b.dataset.j; box.querySelectorAll(".dot").forEach(x => x.setAttribute("aria-checked", x === b));
          const el = pieces[i]; if (RM || !el.animate) { el.style.backgroundPosition = it.colors[col[i]].pos; return; }
          el.animate([{ filter: "url(#alpha-clean) opacity(1)" }, { filter: "url(#alpha-clean) opacity(0)" }], { duration: 110 }).onfinish = () => { el.style.backgroundPosition = it.colors[col[i]].pos; el.animate([{ filter: "url(#alpha-clean) opacity(0)" }, { filter: "url(#alpha-clean) opacity(1)" }], { duration: 110 }); };
        }));
      }
    }
    function open(i) { if (!C.inter.product || (sel === i && dTo === 1)) return; sel = i; fillPV(i); dFrom = d; dTo = 1; dT0 = performance.now(); dDur = RM ? 1 : K.OPEN; pv.inert = false; const b = pv.querySelector(".back"); if (b) b.focus({ preventScroll: true }); }
    function close() { if (sel < 0) return; dFrom = d; dTo = 0; dT0 = performance.now(); dDur = RM ? 1 : K.CLOSE; pv.inert = true; pieces[sel].focus({ preventScroll: true }); }
    function fly(i) {
      count++;
      const done = () => { if (countEl) { countEl.textContent = count; H.bump(countEl); } };
      if (RM || !cartEl) return done();
      const z = H.zoom(frame), fr = frame.getBoundingClientRect(), a = pieces[i].getBoundingClientRect(), b = cartEl.getBoundingClientRect(), { s } = geo();
      const P0 = { x: (a.left + a.width / 2 - fr.left) / z, y: (a.top + a.height / 2 - fr.top) / z }, P2 = { x: (b.left + b.width / 2 - fr.left) / z, y: (b.top + b.height / 2 - fr.top) / z };
      const P1 = { x: (P0.x + P2.x) / 2, y: Math.min(P0.y, P2.y) - 180 * s }, w = a.width / z;
      const el = document.createElement("div"); el.className = "fly spr"; el.style.width = el.style.height = w + "px"; el.style.backgroundPosition = pieces[i].style.backgroundPosition; page.appendChild(el);
      const f0 = performance.now();
      (function step(now) {
        if (signal.aborted) return;
        const q = H.clamp((now - f0) / K.FLY, 0, 1), e = H.eio(q), m = 1 - e;
        const x = m * m * P0.x + 2 * m * e * P1.x + e * e * P2.x, y = m * m * P0.y + 2 * m * e * P1.y + e * e * P2.y;
        el.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%) scale(" + H.lerp(1, .18, e) + ")"; el.style.opacity = q > .85 ? (1 - q) / .15 : 1;
        if (q < 1) requestAnimationFrame(step); else { el.remove(); done(); }
      })(f0);
    }
    pieces.forEach((el, i) => {
      el.addEventListener("click", () => { if (moved > K.CLICK) return; open(i); }, { signal });
      if (C.inter.hover) { el.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") hovI = i; }, { signal }); el.addEventListener("pointerleave", () => { if (hovI === i) hovI = -1; }, { signal }); }
    });
    const back = pv.querySelector(".back"), add = pv.querySelector(".add");
    if (back) back.addEventListener("click", close, { signal });
    if (add) add.addEventListener("click", () => sel >= 0 && fly(sel), { signal });
    scene.addEventListener("pointerdown", e => { if (!C.inter.drag || dTo > 0 || e.button) return; drag = { x: e.clientX, t: performance.now() }; moved = 0; vs = 0; snap = null; scene.style.cursor = "grabbing"; }, { signal });
    window.addEventListener("pointermove", e => {
      if (!drag) return;
      const { g, s } = geo(), now = performance.now(), dx = (e.clientX - drag.x) / H.zoom(frame), dt = Math.max(.001, (now - drag.t) / 1000), dth = dx / (g.R * s);
      th += dth; moved += Math.abs(dx); vs = vs * (1 - K.SMOOTH) + (dth / dt) * K.SMOOTH; drag.x = e.clientX; drag.t = now;
    }, { signal });
    const up = () => { if (!drag) return; if (performance.now() - drag.t > 90) vs = 0; v = RM ? 0 : vs; drag = null; scene.style.cursor = ""; setTimeout(() => { moved = 0; }, 0); };
    window.addEventListener("pointerup", up, { signal }); window.addEventListener("pointercancel", up, { signal });
    page.addEventListener("keydown", e => {
      if (e.key === "Escape" && dTo === 1) { close(); return; }
      if (dTo > 0 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); const dir = e.key === "ArrowLeft" ? 1 : -1; snap = { a: th, b: th + dir * TAU / N, t0: performance.now(), dur: RM ? 1 : K.STEP };
    }, { signal });
    (function tick(now) {
      if (signal.aborted) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; const { g, s } = geo();
      if (d !== dTo) { const q = H.clamp((now - dT0) / dDur, 0, 1); d = H.lerp(dFrom, dTo, H.eo(q)); if (q >= 1) { d = dTo; if (d === 0) sel = -1; } }
      if (snap) { const q = H.clamp((now - snap.t0) / snap.dur, 0, 1); th = H.lerp(snap.a, snap.b, H.eo(q)); if (q >= 1) snap = null; }
      else if (!drag) { const tgt = RM ? 0 : K.OMEGA; v = tgt + (v - tgt) * Math.pow(K.DAMP, dt * 60); th += v * dt * (1 - d); }
      let best = -1, bk = -1;
      for (let i = 0; i < N; i++) {
        const a = th + i * TAU / N, k = (1 + Math.cos(a)) / 2, intro = RM ? 1 : H.eo(H.clamp((now - t0 - 200 - i * 70) / 600, 0, 1));
        let x = g.CX + g.R * Math.sin(a), y = g.CY + (1 - k) * g.DROP, sc = 0.72 + 0.28 * k, rot = K.TILT * Math.sin(a), op = 1;
        hov[i] += ((i === hovI && d === 0 && !drag ? 1 : 0) - hov[i]) * (1 - Math.pow(0.85, dt * 60)); sc *= 1 + K.HOVER * hov[i];
        if (sel >= 0) { if (i === sel) { x = H.lerp(x, g.PX, d); y = H.lerp(y, g.PY, d); sc = H.lerp(sc, g.S1 / g.S0, d); rot = H.lerp(rot, 0, d); } else { x += (Math.sin(a) >= 0 ? 1 : -1) * g.SPREAD * d; op = 1 - d; } }
        const el = pieces[i];
        el.style.transform = "translate(" + x * s + "px," + y * s + "px) translate(-50%,-50%) rotate(" + rot + "deg) scale(" + sc * (.6 + .4 * intro) + ")";
        el.style.opacity = op * intro; el.style.zIndex = i === sel ? 200 : Math.round(k * 100); el.style.pointerEvents = op < .5 ? "none" : "";
        if (k > bk) { bk = k; best = i; }
      }
      if (best !== front) { front = best; cap.querySelector("b").textContent = C.items[best].name; cap.querySelector("span").textContent = C.items[best].price; }
      const ci = RM ? 1 : H.clamp((now - t0 - 900) / 500, 0, 1);
      cap.style.opacity = (1 - d) * ci; pv.style.opacity = d; pv.style.transform = "translateX(" + (1 - d) * 40 * s + "px)";
      requestAnimationFrame(tick);
    })(last);
  }
};

/* b. Essayage par compositeur canvas */
DEMOS.tryon = {
  css(C) {
    const { s, fs } = u;
    return `
.tryon .col h2{font-family:var(--fd);font-weight:var(--wd);font-size:max(15px,${s(30)});line-height:1.05;letter-spacing:-.01em}
.tryon .shop{position:absolute;left:${s(40)};top:${s(104)};width:${s(340)};bottom:${s(64)};display:flex;flex-direction:column;gap:${s(12)};overflow:auto;scrollbar-width:thin;padding:2px}
.tryon .sub{font-size:${fs(13)};color:var(--text2)}
.tryon .search{width:100%;height:max(26px,${s(38)});border:0;border-bottom:1px solid var(--line);background:transparent;font-size:${fs(13)};padding:0;outline-offset:2px}
.tryon .chips{display:flex;flex-wrap:wrap;gap:${s(6)}}
.tryon .grp h3{font-size:${fs(11)};font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--text2);margin:${s(6)} 0 ${s(6)}}
.tryon .opt{display:grid!important;grid-template-columns:auto 1fr auto;align-items:center;gap:${s(12)};width:100%;padding:${s(8)} ${s(10)}!important;border:1px solid transparent!important;border-radius:6px;text-align:left;font-size:${fs(14)}}
.tryon .opt i{width:max(14px,${s(26)});height:max(14px,${s(26)});border-radius:50%;border:1px solid var(--line)}
.tryon .opt em{font-style:normal;color:var(--text2);font-size:${fs(13)}}
.tryon .opt[aria-pressed="true"]{border-color:var(--text)!important;background:var(--ghost)!important}
.tryon .stagecol{position:absolute;left:${s(420)};top:${s(92)};width:${s(600)};bottom:${s(56)};background-size:cover;background-position:center;border-radius:${s(10)}}
.tryon.ar .stagecol{background-image:var(--room)}
.tryon .plat{position:absolute;left:50%;bottom:${s(66)};width:${s(380)};height:${s(56)};margin-left:${s(-190)};border-radius:50%;border:1px solid var(--line);background:var(--ghost)}
.tryon.ar .plat{opacity:.35}
.tryon .turn{position:absolute;left:50%;top:${s(4)};height:${s(660)};aspect-ratio:${C.tryon.w}/${C.tryon.h};transform:translateX(-50%);perspective:${s(1400)};touch-action:pan-y;cursor:ew-resize}
.tryon .mann{position:absolute;inset:0;will-change:transform}
.tryon canvas{position:absolute;inset:0;width:100%;height:100%;filter:url(#alpha-clean)}
.tryon .scan{position:absolute;left:-8%;right:-8%;top:0;height:2px;background:var(--accent);opacity:0;pointer-events:none}
.tryon .bubble{position:absolute;left:50%;top:${s(14)};transform:translateX(-50%);background:var(--text);color:var(--bg);font-size:${fs(13)};padding:${s(8)} ${s(14)};border-radius:99px;white-space:nowrap;opacity:0;transition:opacity .3s;z-index:5;pointer-events:none}
.tryon .bubble.on{opacity:1}
.tryon .tools{position:absolute;left:50%;bottom:${s(8)};transform:translateX(-50%);display:flex;gap:${s(8)};z-index:5}
.tryon .recap{position:absolute;left:${s(1060)};top:${s(104)};width:${s(340)};display:flex;flex-direction:column;gap:${s(14)}}
.tryon .lines{display:grid;gap:${s(8)};border-top:1px solid var(--line);padding-top:${s(12)}}
.tryon .ln{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:${fs(14)}}
.tryon .ln small{grid-column:1/-1;font-size:${fs(11)};letter-spacing:.1em;text-transform:uppercase;color:var(--text2)}
.tryon .tot{display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:${s(12)};font-size:${fs(15)};font-weight:600}
.tryon .scorebox small{font-size:${fs(11)};letter-spacing:.1em;text-transform:uppercase;color:var(--text2)}
.tryon .scorebox b{display:block;font-family:var(--fd);font-weight:var(--wd);font-size:max(22px,${s(64)});line-height:1;font-variant-numeric:tabular-nums}
.tryon .meter{height:4px;background:var(--line);margin-top:${s(8)}}
.tryon .meter i{display:block;height:100%;width:0;background:var(--accent)}
MQP{
.tryon .stagecol{left:0;top:${s(56)};width:${s(390)};height:${s(400)};bottom:auto;border-radius:0}
.tryon .turn{height:${s(330)}}
.tryon .plat{width:${s(200)};height:${s(30)};margin-left:${s(-100)};bottom:${s(48)}}
.tryon .shop{left:${s(16)};top:${s(464)};width:${s(358)};bottom:auto;height:${s(206)};gap:${s(6)}}
.tryon .shop h2,.tryon .shop .sub{display:none}
.tryon .recap{left:${s(16)};top:${s(678)};width:${s(358)};gap:${s(6)}}
.tryon .recap h2,.tryon .lines{display:none}
.tryon .scorebox{display:flex;align-items:baseline;gap:${s(10)}}
.tryon .scorebox b{font-size:${s(26)}}
.tryon .meter{flex:1}
.tryon .tot{padding-top:${s(6)}}
.tryon .cta{height:${s(40)};font-size:${s(12)}}
.tryon .pill{height:${s(30)};font-size:${s(10)};padding:0 ${s(10)}!important}
}`;
  },
  html(C) {
    const k = C.copy, T = C.tryon;
    return `<div class="scene" style="--room:url('${T.room || ""}')">
<section class="col shop" aria-label="${esc(k.shopTitle)}"><h2>${esc(k.shopTitle)}</h2><p class="sub">${esc(k.subtitle)}</p>
${C.inter.search ? `<input class="search" type="search" placeholder="${esc(k.search)}" aria-label="${esc(k.search)}">` : ""}
${C.inter.filters ? `<div class="chips" role="group" aria-label="Filtres"><button type="button" class="pill" data-f="-1" aria-pressed="true">${esc(k.filterAll)}</button>${T.slots.map((sl, i) => `<button type="button" class="pill" data-f="${i}" aria-pressed="false">${esc(sl.label)}</button>`).join("")}</div>` : ""}
${T.slots.map((sl, i) => `<div class="grp" data-s="${i}"><h3>${esc(sl.label)}</h3>${sl.opts.map((o, v) => `<button type="button" class="opt" data-s="${i}" data-v="${v}" aria-pressed="${v === 0}"><i style="background:${o.hex}"></i><span>${esc(o.name)}</span><em>${esc(o.price)}</em></button>`).join("")}</div>`).join("")}
</section>
<section class="stagecol" aria-label="${esc(k.title)}"><div class="plat" aria-hidden="true"></div><div class="bubble" aria-live="polite"></div>
<div class="turn" tabindex="0" role="img" aria-label="${esc(k.title)}"><div class="mann"><canvas class="cvA"></canvas><canvas class="cvB"></canvas><div class="scan"></div></div></div>
<div class="tools"><button type="button" class="pill sty" aria-pressed="false">${esc(k.stylist)}</button>${C.inter.ar ? `<button type="button" class="pill arb" aria-pressed="false">${esc(k.ar)}</button>` : ""}<button type="button" class="pill rst">${esc(k.reset)}</button></div>
</section>
<section class="col recap" aria-label="${esc(k.recapTitle)}"><h2>${esc(k.recapTitle)}</h2>
<div class="lines">${T.slots.map((sl, i) => `<div class="ln" data-s="${i}"><small>${esc(sl.label)}</small><span></span><em style="font-style:normal"></em></div>`).join("")}</div>
<div class="tot"><span>${esc(k.total)}</span><span class="sum"></span></div>
<div class="scorebox"><small>${esc(k.score)}</small><b>0</b><div class="meter"><i></i></div></div>
${C.inter.cart ? `<button type="button" class="cta add">${esc(k.cta)}</button>` : ""}
</section></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, T = C.tryon, RM = C.rm, W = T.w, HH = T.h, page = root.querySelector(".page");
    const cvA = root.querySelector(".cvA"), cvB = root.querySelector(".cvB"), scan = root.querySelector(".scan"), mann = root.querySelector(".mann"), turn = root.querySelector(".turn"), plat = root.querySelector(".plat"), bubble = root.querySelector(".bubble");
    [cvA, cvB].forEach(c => { c.width = W; c.height = HH; }); cvB.style.opacity = 0;
    const a = cvA.getContext("2d"), b = cvB.getContext("2d"), tmp = document.createElement("canvas"); tmp.width = W; tmp.height = HH; const t = tmp.getContext("2d");
    const load = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    let pick = [0, 0, 0, 0], imgs = [], masks = [], wipe = null, rot = 0, rotT = 0, drag = null, timers = [], styOn = false, score = 0, sFrom = 0, sTo = 0, sT0 = 0, count = 0, last = performance.now();
    function compose(ctx, p) {
      ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, W, HH); if (!imgs[0]) return; ctx.drawImage(imgs[0], 0, 0, W, HH);
      for (let si = 0; si < 4; si++) {
        const v = p[si]; if (!v) continue; const idx = si * 2 + v - 1, im = imgs[1 + idx], m = masks[idx]; if (!im || !m) continue;
        ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(m, 0, 0, W, HH);
        t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, W, HH); t.drawImage(im, 0, 0, W, HH); t.globalCompositeOperation = "destination-in"; t.drawImage(m, 0, 0, W, HH);
        ctx.globalCompositeOperation = "lighter"; ctx.drawImage(tmp, 0, 0);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    function sync() {
      root.querySelectorAll(".opt").forEach(o => o.setAttribute("aria-pressed", pick[+o.dataset.s] === +o.dataset.v));
      let sum = 0, pts = 0;
      T.slots.forEach((sl, i) => { const o = sl.opts[pick[i]], ln = root.querySelector('.ln[data-s="' + i + '"]'); ln.children[1].textContent = o.name; ln.children[2].textContent = o.price; sum += H.price(o.price); pts += +o.pts || 0; });
      root.querySelector(".sum").textContent = H.money(sum, T.slots[0].opts[0].price);
      const bonus = T.looks.some(l => l.pick.every((v, i) => v === pick[i])) ? K.SCORE_BONUS : 0;
      sFrom = score; sTo = Math.min(100, K.SCORE_BASE + pts + bonus); sT0 = performance.now();
    }
    function apply(np) {
      if (np.every((v, i) => v === pick[i])) return;
      pick = np.slice(); b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, W, HH); b.drawImage(cvA, 0, 0); compose(a, pick);
      if (RM) cvB.style.opacity = 0; else { wipe = { t0: performance.now() }; cvB.style.opacity = 1; cvB.style.clipPath = "inset(0 0 0 0)"; }
      sync();
    }
    function stopSty() { timers.forEach(clearTimeout); timers = []; styOn = false; const s = root.querySelector(".sty"); s.setAttribute("aria-pressed", "false"); bubble.classList.remove("on"); }
    function runLook(li) {
      if (!styOn) return; const L = T.looks[li % T.looks.length]; let delay = 0; bubble.textContent = L.name; bubble.classList.add("on");
      if (RM) apply(L.pick); else L.pick.forEach((v, si) => { if (pick[si] === v) return; timers.push(setTimeout(() => { const np = pick.slice(); np[si] = v; apply(np); }, delay)); delay += K.STY_STEP; });
      timers.push(setTimeout(() => runLook(li + 1), delay + K.STY_PAUSE));
    }
    root.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => { stopSty(); const np = pick.slice(); np[+o.dataset.s] = +o.dataset.v; apply(np); }, { signal }));
    root.querySelector(".sty").addEventListener("click", e => { if (styOn) return stopSty(); styOn = true; e.currentTarget.setAttribute("aria-pressed", "true"); runLook(0); }, { signal });
    root.querySelector(".rst").addEventListener("click", () => { stopSty(); apply([0, 0, 0, 0]); rotT = 0; }, { signal });
    const arb = root.querySelector(".arb"); if (arb) arb.addEventListener("click", () => { const on = page.classList.toggle("ar"); arb.setAttribute("aria-pressed", on); }, { signal });
    const add = root.querySelector(".add"), countEl = root.querySelector(".count"); if (add) add.addEventListener("click", () => { count++; if (countEl) { countEl.textContent = count; H.bump(countEl); } }, { signal });
    const search = root.querySelector(".search"); let fq = "", ff = -1;
    const filt = () => root.querySelectorAll(".grp").forEach(g => { let any = false; g.querySelectorAll(".opt").forEach(o => { const ok = o.children[1].textContent.toLowerCase().includes(fq); o.style.display = ok ? "" : "none"; any = any || ok; }); g.style.display = any && (ff < 0 || ff === +g.dataset.s) ? "" : "none"; });
    if (search) search.addEventListener("input", () => { fq = search.value.trim().toLowerCase(); filt(); }, { signal });
    root.querySelectorAll(".chips .pill").forEach(p => p.addEventListener("click", () => { ff = +p.dataset.f; root.querySelectorAll(".chips .pill").forEach(x => x.setAttribute("aria-pressed", x === p)); filt(); }, { signal }));
    if (C.inter.drag) {
      turn.addEventListener("pointerdown", e => { drag = { x: e.clientX }; }, { signal });
      window.addEventListener("pointermove", e => { if (!drag) return; rotT = H.clamp(rotT + (e.clientX - drag.x) / H.zoom(frame) * K.ROTSENS, -K.ROTMAX, K.ROTMAX); drag.x = e.clientX; }, { signal });
      window.addEventListener("pointerup", () => { drag = null; }, { signal });
      turn.addEventListener("dblclick", () => { rotT = 0; }, { signal });
    }
    turn.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); rotT = H.clamp(rotT + (e.key === "ArrowLeft" ? -1 : 1) * K.ROTMAX / 4, -K.ROTMAX, K.ROTMAX); } }, { signal });
    signal.addEventListener("abort", () => timers.forEach(clearTimeout));
    Promise.all(T.photos.map(load).concat(T.masks.map(load))).then(all => {
      if (signal.aborted) return; imgs = all.slice(0, T.photos.length); masks = all.slice(T.photos.length); compose(a, pick); sync();
      if (!RM && mann.animate) mann.animate([{ opacity: 0, transform: "translateY(3%)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
    });
    sync();
    (function tick(now) {
      if (signal.aborted) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (wipe) { const q = H.clamp((now - wipe.t0) / K.WIPE, 0, 1), e = H.eio(q) * 100; cvB.style.clipPath = "inset(" + e + "% 0 0 0)"; scan.style.top = e + "%"; scan.style.opacity = q < 1 ? 1 : 0; if (q >= 1) { wipe = null; cvB.style.opacity = 0; } }
      rot += (rotT - rot) * (RM ? 1 : 1 - Math.pow(K.ROTDAMP, dt * 60)); mann.style.transform = "rotateY(" + rot + "deg)"; plat.style.transform = "rotate(" + rot * .2 + "deg)";
      if (score !== sTo) { const q = RM ? 1 : H.clamp((now - sT0) / K.COUNT, 0, 1); score = q >= 1 ? sTo : H.lerp(sFrom, sTo, H.eo(q)); root.querySelector(".scorebox b").textContent = Math.round(score); root.querySelector(".meter i").style.width = score + "%"; }
      requestAnimationFrame(tick);
    })(last);
  }
};

/* c. Cartes empilées */
DEMOS.stack = {
  css(C) {
    const { s, fs } = u, K = C.K;
    return `
.stack .ghost{position:absolute;left:50%;top:${s(450)};transform:translate(-50%,-50%);font-family:var(--fd);font-weight:var(--wd);font-size:${s(300)};line-height:1;letter-spacing:-.04em;color:var(--ghost);white-space:nowrap;pointer-events:none}
.stack .pile{position:absolute;left:${s(720)};top:${s(450)};width:0;height:0}
.stack .card{position:absolute;left:0;top:0;width:${s(K.CW)};height:${s(K.CH)};background:var(--bg);border:1px solid var(--line);border-radius:${s(18)};display:flex;flex-direction:column;align-items:center;gap:${s(8)};padding:${s(22)};touch-action:pan-y;cursor:grab;will-change:transform}
.stack .card .spr{width:${s(250)};height:${s(250)};pointer-events:none}
.stack .card b{font-family:var(--fd);font-weight:var(--wd);font-size:max(12px,${s(24)});letter-spacing:-.01em}
.stack .card em{font-style:normal;font-size:${fs(14)};color:var(--text2)}
.stack .card .row{display:flex;align-items:center;gap:${s(14)};margin-top:auto}
.stack .card .cta{height:max(26px,${s(40)});padding:0 ${s(16)}!important;font-size:${fs(11)}}
.stack .card .dot{width:max(14px,${s(20)});height:max(14px,${s(20)})}
.stack .pager{position:absolute;left:50%;top:${s(760)};transform:translateX(-50%);display:flex;align-items:center;gap:${s(20)};font-size:${fs(13)};font-variant-numeric:tabular-nums;letter-spacing:.08em;color:var(--text2)}
.stack .arrow{width:max(28px,${s(44)});height:max(28px,${s(44)});border:1px solid var(--line)!important;border-radius:50%;font-size:${fs(16)};color:var(--text)}
MQP{
.stack .pile{left:${s(180)};top:${s(410)}}
.stack .card{width:${s(250)};height:${s(380)};padding:${s(16)}}
.stack .card .spr{width:${s(190)};height:${s(190)}}
.stack .card b{font-size:${s(18)}}
.stack .ghost{font-size:${s(110)};top:${s(410)}}
.stack .pager{top:${s(690)}}
}`;
  },
  html(C) {
    const k = C.copy;
    return `<div class="scene"><div class="ghost" aria-hidden="true">${esc(k.ghost)}</div><div class="head"><h1>${esc(k.title)}</h1><p>${esc(k.subtitle)}</p></div>
<div class="pile" role="group" aria-roledescription="carrousel" aria-label="${esc(k.title)}">${C.items.map((it, i) => `<article class="card" data-i="${i}" aria-label="${esc(it.name)}, ${esc(it.price)}"><div class="spr" style="background-position:${it.colors[0].pos}"></div><b>${esc(it.name)}</b><em>${esc(it.price)}</em><div class="row">${C.inter.swatches ? swHTML(it, i) : ""}${C.inter.cart ? `<button type="button" class="cta add" data-i="${i}">${esc(k.cta)}</button>` : ""}</div></article>`).join("")}</div>
<div class="pager"><button type="button" class="arrow prev" aria-label="Carte précédente">&#8592;</button><span class="pg" aria-live="polite"></span><button type="button" class="arrow next" aria-label="Carte suivante">&#8594;</button></div></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, RM = C.rm, cards = [...root.querySelectorAll(".card")], N = cards.length, pg = root.querySelector(".pg"), countEl = root.querySelector(".count");
    let a = 0, drag = null, dx = 0, busy = false, hover = false, count = 0, moved = 0;
    const f = () => (H.portrait(frame) ? .72 : 1) * root.querySelector(".scene").offsetWidth / (H.portrait(frame) ? 390 : 1440);
    function lay() {
      const q = f();
      cards.forEach((el, i) => {
        const j = ((i - a) % N + N) % N, top = j === 0;
        el.style.transition = (drag && top) || RM ? "none" : "transform " + K.MOVE + "ms cubic-bezier(.4,0,.2,1), opacity " + K.MOVE + "ms";
        el.style.transform = "translate(-50%,-50%) translate(" + (j * K.DX * q + (top ? dx : 0)) + "px," + j * K.DY * q + "px) rotate(" + (j * K.ROT + (top ? dx * K.DRAGROT : 0)) + "deg) scale(" + (1 - j * K.SC) + ")";
        el.style.opacity = j <= K.VIS ? 1 - j * K.FADE : 0; el.style.zIndex = N - j; el.inert = !top;
      });
      pg.textContent = H.pad(a + 1) + " / " + H.pad(N);
    }
    function go(dir) {
      if (busy) return; busy = true; const el = cards[a];
      if (dir > 0 && !RM) { el.style.transition = "transform " + K.OUT + "ms cubic-bezier(.4,0,.2,1), opacity " + K.OUT + "ms"; el.style.transform = "translate(-50%,-50%) translate(" + (dx < 0 || dx === 0 ? -1 : 1) * K.FLYX * f() + "px,0) rotate(" + (dx <= 0 ? -1 : 1) * K.FLYROT + "deg)"; el.style.opacity = 0; }
      setTimeout(() => { if (signal.aborted) return; a = ((a + dir) % N + N) % N; dx = 0; busy = false; lay(); }, dir > 0 && !RM ? K.OUT : 0);
    }
    cards.forEach(el => {
      el.addEventListener("pointerdown", e => { if (!C.inter.drag || el.inert || e.target.closest("button")) return; drag = { x: e.clientX, t: performance.now(), x0: e.clientX }; moved = 0; }, { signal });
      el.addEventListener("pointerenter", () => { hover = true; }, { signal }); el.addEventListener("pointerleave", () => { hover = false; }, { signal });
    });
    window.addEventListener("pointermove", e => { if (!drag) return; dx = (e.clientX - drag.x0) / H.zoom(frame); moved = Math.abs(dx); lay(); }, { signal });
    window.addEventListener("pointerup", e => { if (!drag) return; const vel = Math.abs(dx) / Math.max(1, performance.now() - drag.t); drag = null; if (Math.abs(dx) > K.THRESH * f() || vel > .6) go(1); else { dx = 0; cards[a].style.transition = "transform 380ms cubic-bezier(.34,1.56,.64,1)"; lay(); cards[a].style.transition = "transform 380ms cubic-bezier(.34,1.56,.64,1)"; } }, { signal });
    root.querySelector(".next").addEventListener("click", () => go(1), { signal }); root.querySelector(".prev").addEventListener("click", () => go(-1), { signal });
    root.querySelector(".page").addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }, { signal });
    root.querySelectorAll(".dot").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.i, j = +b.dataset.j; b.parentNode.querySelectorAll(".dot").forEach(x => x.setAttribute("aria-checked", x === b)); cards[i].querySelector(".spr").style.backgroundPosition = C.items[i].colors[j].pos; }, { signal }));
    root.querySelectorAll(".add").forEach(b => b.addEventListener("click", () => { count++; if (countEl) { countEl.textContent = count; H.bump(countEl); } }, { signal }));
    if (!RM) { const id = setInterval(() => { if (!hover && !drag && !root.querySelector(".page").matches(":focus-within")) go(1); }, K.AUTO); signal.addEventListener("abort", () => clearInterval(id)); }
    const ro = new ResizeObserver(lay); ro.observe(frame); signal.addEventListener("abort", () => ro.disconnect()); lay();
    if (!RM) cards.forEach((el, i) => el.animate && el.animate([{ opacity: 0, transform: el.style.transform + " translateY(60px)" }, { opacity: el.style.opacity, transform: el.style.transform }], { duration: 700, delay: ((i - a + N) % N) * 80, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
  }
};

/* d. Rail qui défile */
DEMOS.rail = {
  css(C) {
    const { s, fs } = u, K = C.K;
    return `
.rail{--cell:${K.CELL}}
.rail .scene{touch-action:pan-y;cursor:grab}
.rail .head{left:50%;top:${s(130)};transform:translateX(-50%);text-align:center;white-space:nowrap}
.rail .head h1{font-size:max(22px,${s(76)});letter-spacing:-.02em;text-transform:none;line-height:1}
.rail .head p{font-size:max(11px,${s(18)});margin-top:${s(14)}}
.rail .ghost{position:absolute;left:50%;top:${s(760)};transform:translate(-50%,-50%);font-family:var(--fd);font-weight:var(--wd);font-size:${s(190)};line-height:1;letter-spacing:-.03em;color:var(--ghost);white-space:nowrap;pointer-events:none}
.rail .line{position:absolute;left:-50vw;right:-50vw;top:${s(K.Y + K.CELL / 2 + 18)};height:1px;background:var(--line)}
.rail .it{position:absolute;left:0;top:0;width:calc(var(--cell) * var(--s));display:flex!important;flex-direction:column;align-items:center;gap:${s(26)};will-change:transform}
.rail .it .spr{width:calc(var(--cell) * var(--s));height:calc(var(--cell) * var(--s))}
.rail .it .lab{text-align:center;white-space:nowrap;font-size:${fs(13)};color:var(--text2);text-transform:none;letter-spacing:0}
.rail .it .lab b{display:block;font-family:var(--fd);font-weight:var(--wd);font-size:max(11px,${s(18)});color:var(--text)}
MQP{
.rail{--cell:150}
.rail .head{top:${s(110)};white-space:normal;width:${s(340)}}
.rail .head h1{font-size:${s(40)}}
.rail .head p{font-size:${s(14)}}
.rail .line{top:${s(400 + 75 + 14)}}
.rail .ghost{top:${s(700)};font-size:${s(70)}}
}`;
  },
  html(C) {
    const k = C.copy, N = C.items.length, reps = Math.max(1, Math.ceil((1440 + 2 * C.K.GAP) / (N * C.K.GAP)));
    let h = "";
    for (let r = 0; r < reps; r++) C.items.forEach((it, i) => { h += `<button type="button" class="it" data-i="${i}" ${r ? 'tabindex="-1" aria-hidden="true"' : `aria-label="${esc(it.name)}, ${esc(it.price)}"`}><span class="spr" style="background-position:${it.colors[r % it.colors.length].pos}"></span><span class="lab"><b>${esc(it.name)}</b>${esc(it.price)}</span></button>`; });
    return `<div class="scene"><div class="ghost" aria-hidden="true">${esc(k.ghost)}</div><div class="head"><h1>${esc(k.title)}</h1><p>${esc(k.subtitle)}</p></div><div class="line"></div><div class="track" role="group" aria-label="${esc(k.title)}">${h}</div></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, RM = C.rm, its = [...root.querySelectorAll(".it")], M = its.length, scene = root.querySelector(".scene"), countEl = root.querySelector(".count");
    let p = 0, v = RM ? 0 : K.SPEED, vs = 0, drag = null, moved = 0, hovI = -1, count = 0, last = performance.now(); const t0 = last, hov = its.map(() => 0);
    const geo = () => { const P = H.portrait(frame); return { FW: P ? 390 : 1440, GAP: P ? 190 : K.GAP, CX: P ? 195 : 720, Y: P ? 400 : K.Y, FOCUS: P ? 190 : K.FOCUS }; };
    its.forEach((el, i) => {
      if (C.inter.hover) { el.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") hovI = i; }, { signal }); el.addEventListener("pointerleave", () => { if (hovI === i) hovI = -1; }, { signal }); }
      el.addEventListener("click", () => { if (moved > 6 || !C.inter.cart) return; count++; if (countEl) { countEl.textContent = count; H.bump(countEl); } }, { signal });
    });
    scene.addEventListener("pointerdown", e => { if (!C.inter.drag || e.button) return; drag = { x: e.clientX, t: performance.now() }; moved = 0; vs = 0; }, { signal });
    window.addEventListener("pointermove", e => { if (!drag) return; const g = geo(), s = scene.offsetWidth / g.FW, now = performance.now(), dx = (e.clientX - drag.x) / H.zoom(frame) / s, dt = Math.max(.001, (now - drag.t) / 1000); p -= dx; moved += Math.abs(dx); vs = vs * .8 + (-dx / dt) * .2; drag.x = e.clientX; drag.t = now; }, { signal });
    window.addEventListener("pointerup", () => { if (!drag) return; if (performance.now() - drag.t > 90) vs = 0; v = RM ? 0 : vs; drag = null; setTimeout(() => { moved = 0; }, 0); }, { signal });
    root.querySelector(".page").addEventListener("keydown", e => { if (e.key === "ArrowRight") p += geo().GAP; if (e.key === "ArrowLeft") p -= geo().GAP; }, { signal });
    (function tick(now) {
      if (signal.aborted) return; const dt = Math.min(.05, (now - last) / 1000); last = now; const g = geo(), s = scene.offsetWidth / g.FW, Lt = M * g.GAP, t = (now - t0) / 1000;
      if (!drag) { const tgt = RM ? 0 : K.SPEED * (hovI >= 0 ? 1 - K.SLOW : 1); v = tgt + (v - tgt) * Math.pow(K.DAMP, dt * 60); p += v * dt; }
      for (let i = 0; i < M; i++) {
        const x = (((i * g.GAP - p) % Lt) + Lt) % Lt - Math.floor(M / 2) * g.GAP + g.CX, fo = Math.max(0, 1 - Math.abs(x - g.CX) / g.FOCUS);
        hov[i] += ((i === hovI ? 1 : 0) - hov[i]) * (1 - Math.pow(.85, dt * 60));
        const y = g.Y + (RM ? 0 : K.BOB * Math.sin(t * K.BOBF + i * K.PHASE)) - K.LIFT * hov[i], el = its[i], intro = RM ? 1 : H.eo(H.clamp((now - t0 - 150 - (i % 8) * 60) / 600, 0, 1));
        el.style.transform = "translate(" + x * s + "px," + (y + (1 - intro) * 40) * s + "px) translate(-50%,0) translateY(calc(var(--cell) * var(--s) * -0.5)) scale(" + (1 + K.ZOOM * fo) + ")";
        el.style.opacity = intro; el.style.zIndex = Math.round(fo * 10);
        el.lastElementChild.style.opacity = Math.max(H.clamp((fo - .5) * 2, 0, 1), hov[i]);
      }
      requestAnimationFrame(tick);
    })(last);
  }
};

/* e. Portfolio VHS */
DEMOS.vhs = {
  css(C) {
    const { s, fs } = u, K = C.K;
    return `
.vhs .head{top:${s(112)}}
.vhs .chips{position:absolute;left:${s(60)};top:${s(186)};display:flex;gap:${s(6)};z-index:3}
.vhs .list{position:absolute;left:${s(60)};top:${s(250)};width:${s(520)};display:grid;gap:${s(4)}}
.vhs .rowi{display:grid!important;grid-template-columns:${s(44)} 1fr auto;align-items:baseline;gap:${s(10)};width:100%;text-align:left;padding:${s(8)} 0!important;border-bottom:1px solid var(--line)!important;color:var(--text2)}
.vhs .rowi i{font-style:normal;font-size:${fs(12)};font-variant-numeric:tabular-nums}
.vhs .rowi b{font-family:var(--fd);font-weight:var(--wd);font-size:max(14px,${s(38)});line-height:1.05;letter-spacing:-.01em}
.vhs .rowi em{font-style:normal;font-size:${fs(12)};letter-spacing:.06em}
.vhs .rowi[aria-current="true"]{color:var(--text)}
.vhs .rowi[aria-current="true"] b{color:var(--accent)}
.vhs .screen{position:absolute;left:${s(660)};top:${s(150)};width:${s(720)};height:${s(540)};background:#000;overflow:hidden;border-radius:${s(14)}}
.vhs .pic{position:absolute;inset:0}
.vhs .pic div{position:absolute;inset:0;background-size:cover;background-position:center;mix-blend-mode:screen;background-blend-mode:multiply}
.vhs .pic .r{background-image:linear-gradient(#f00,#f00),var(--img);transform:translateX(${-K.SPLIT}px)}
.vhs .pic .gb{background-image:linear-gradient(#0ff,#0ff),var(--img);transform:translateX(${K.SPLIT}px)}
.vhs .jit{animation:vj ${K.JIT}ms steps(2) infinite}
.vhs .lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.4) 0 2px,transparent 2px 4px);pointer-events:none}
.vhs .trackbar{position:absolute;left:0;right:0;height:14%;top:-14%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.16),transparent);animation:vt ${K.TRACK}ms linear infinite}
.vhs canvas{position:absolute;inset:0;width:100%;height:100%;opacity:.08;image-rendering:pixelated;mix-blend-mode:screen}
.vhs .osd{position:absolute;left:${s(22)};right:${s(22)};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:max(10px,${s(16)});color:#fff;display:flex;justify-content:space-between;text-shadow:1px 0 #f0f,-1px 0 #0ff;letter-spacing:.06em}
.vhs .osd.t{top:${s(18)}} .vhs .osd.b{bottom:${s(18)}}
.vhs .recdot{display:inline-block;width:.6em;height:.6em;border-radius:50%;background:#f33;margin-right:.5em;animation:vb 1s steps(2) infinite}
.vhs .desc{position:absolute;left:${s(660)};top:${s(710)};width:${s(720)};font-size:${fs(14)};color:var(--text2)}
@keyframes vj{from{transform:translate(-1px,0)}to{transform:translate(1px,.5px)}}
@keyframes vt{to{top:100%}}
@keyframes vb{50%{opacity:0}}
.vhs.rm .jit,.vhs.rm .trackbar,.vhs.rm .recdot{animation:none}
MQP{
.vhs .chips{left:${s(20)};top:${s(126)}}
.vhs .screen{left:${s(20)};top:${s(170)};width:${s(350)};height:${s(262)}}
.vhs .desc{left:${s(20)};top:${s(442)};width:${s(350)}}
.vhs .list{left:${s(20)};top:${s(500)};width:${s(350)}}
.vhs .rowi b{font-size:${s(22)}}
.vhs .rowi{grid-template-columns:${s(30)} 1fr auto}
}`;
  },
  html(C) {
    const k = C.copy, tags = [...new Set(C.items.map(i => i.tag).filter(Boolean))];
    return `<div class="scene"><div class="head"><h1>${esc(k.title)}</h1><p>${esc(k.subtitle)}</p></div>
${C.inter.filters ? `<div class="chips" role="group" aria-label="Filtres"><button type="button" class="pill" data-f="" aria-pressed="true">${esc(k.filterAll)}</button>${tags.map(t => `<button type="button" class="pill" data-f="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>` : ""}
<div class="list" role="listbox" aria-label="${esc(k.title)}">${C.items.map((it, i) => `<button type="button" class="rowi" role="option" data-i="${i}" data-tag="${esc(it.tag)}" aria-current="${i === 0}"><i>${H.pad(i + 1)}</i><b>${esc(it.name)}</b><em>${esc(it.price)}</em></button>`).join("")}</div>
<div class="screen" aria-hidden="true"><div class="pic jit"><div class="r"></div><div class="gb"></div></div><canvas width="96" height="72"></canvas><div class="lines"></div><div class="trackbar"></div>
<div class="osd t"><span><span class="recdot"></span>${esc(k.rec)}</span><span class="idx"></span></div><div class="osd b"><span class="nm"></span><span class="tc">00:00:00:00</span></div></div>
<p class="desc" aria-live="polite"></p></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, RM = C.rm, page = root.querySelector(".page"), rows = [...root.querySelectorAll(".rowi")], pic = root.querySelector(".pic"), cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    if (RM) page.classList.add("rm");
    let cur = -1, gl = 0, last = 0, lastN = 0; const t0 = performance.now();
    function show(i) { pic.style.setProperty("--img", "url('" + (C.images[i] || "") + "')"); root.querySelector(".nm").textContent = C.items[i].name; root.querySelector(".idx").textContent = H.pad(i + 1) + " / " + H.pad(C.items.length); root.querySelector(".desc").textContent = C.items[i].desc; }
    function sel(i) {
      if (i === cur) return; cur = i; rows.forEach((r, j) => r.setAttribute("aria-current", j === i));
      if (RM) return show(i);
      const steps = K.BANDS, each = K.GLITCH / steps; let n = 0; clearInterval(gl);
      gl = setInterval(() => { n++; if (n === Math.ceil(steps / 2)) show(i); if (n >= steps) { clearInterval(gl); pic.style.clipPath = ""; pic.style.translate = ""; return; } pic.style.translate = (Math.random() * 2 - 1) * K.SHIFT + "px 0"; pic.style.clipPath = "inset(" + Math.random() * 60 + "% 0 " + Math.random() * 60 + "% 0)"; }, each);
    }
    rows.forEach((r, i) => { r.addEventListener("click", () => sel(i), { signal }); r.addEventListener("focus", () => sel(i), { signal }); if (C.inter.hover) r.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") sel(i); }, { signal }); });
    root.querySelector(".list").addEventListener("keydown", e => { if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return; e.preventDefault(); const vis = rows.filter(r => r.style.display !== "none"), at = vis.indexOf(rows[cur]), nx = vis[(at + (e.key === "ArrowDown" ? 1 : -1) + vis.length) % vis.length]; nx.focus(); }, { signal });
    root.querySelectorAll(".chips .pill").forEach(p => p.addEventListener("click", () => { root.querySelectorAll(".chips .pill").forEach(x => x.setAttribute("aria-pressed", x === p)); rows.forEach(r => { r.style.display = !p.dataset.f || r.dataset.tag === p.dataset.f ? "" : "none"; }); const first = rows.findIndex(r => r.style.display !== "none"); if (first >= 0) sel(first); }, { signal }));
    signal.addEventListener("abort", () => clearInterval(gl));
    function noise() { const id = ctx.createImageData(96, 72), d = id.data; for (let p = 0; p < d.length; p += 4) { const n = Math.random() * 255; d[p] = d[p + 1] = d[p + 2] = n; d[p + 3] = 255; } ctx.putImageData(id, 0, 0); }
    noise(); sel(0);
    if (!RM) {
      rows.forEach((r, i) => r.animate && r.animate([{ opacity: 0, transform: "translateX(-24px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 200 + i * 60, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
      (function tick(now) {
        if (signal.aborted) return;
        if (now - lastN > 1000 / K.NOISE) { lastN = now; noise(); }
        if (now - last > 1000 / K.FPS) { last = now; const fr = Math.floor((now - t0) / 1000 * K.FPS), ss = Math.floor(fr / K.FPS); root.querySelector(".tc").textContent = H.pad(Math.floor(ss / 3600)) + ":" + H.pad(Math.floor(ss / 60) % 60) + ":" + H.pad(ss % 60) + ":" + H.pad(fr % K.FPS); }
        requestAnimationFrame(tick);
      })(t0);
    }
  }
};

/* f. Lookbook plein écran */
DEMOS.lookbook = {
  css(C) {
    const { s, fs } = u, K = C.K;
    return `
.lookbook .side{position:absolute;left:0;top:0;width:${s(560)};height:100%;padding:${s(150)} ${s(60)} ${s(90)};display:flex;flex-direction:column;z-index:2}
.lookbook .idx{font-size:${fs(13)};letter-spacing:.1em;color:var(--text2);font-variant-numeric:tabular-nums}
.lookbook .kicker{font-size:${fs(12)};letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-top:${s(26)}}
.lookbook h2{font-family:var(--fd);font-weight:var(--wd);font-size:max(24px,${s(84)});line-height:.98;letter-spacing:-.02em;margin-top:${s(12)};overflow:hidden;padding-bottom:.08em}
.lookbook h2 span{display:inline-block;white-space:pre;transition:transform ${K.LET}ms cubic-bezier(.22,1,.36,1)}
.lookbook .desc{font-size:max(11px,${s(17)});color:var(--text2);line-height:1.5;margin-top:${s(22)};max-width:${s(400)}}
.lookbook .meta{font-size:${fs(14)};margin-top:${s(14)}}
.lookbook .ctrl{margin-top:auto;display:flex;align-items:center;gap:${s(14)}}
.lookbook .arrow{width:max(28px,${s(46)});height:max(28px,${s(46)});border:1px solid var(--line)!important;border-radius:50%;font-size:${fs(16)}}
.lookbook .bar{flex:1;height:2px;background:var(--line)}
.lookbook .bar i{display:block;height:100%;width:0;background:var(--text)}
.lookbook .view{position:absolute;left:${s(560)};top:0;right:calc((100VW - var(--fw) * var(--s)) / -2);height:100%;overflow:hidden;touch-action:pan-y}
.lookbook .sl{position:absolute;inset:0;background-size:cover;background-position:center;will-change:transform,clip-path}
.lookbook .scene{height:100%;top:0;transform:translateX(-50%)}
.lookbook .nav,.lookbook .foot{mix-blend-mode:difference}
.lookbook .nav a,.lookbook .foot{color:#fff}
MQP{
.lookbook .view{left:0;right:0;top:${s(56)};height:${s(420)}}
.lookbook .side{top:${s(476)};width:100%;height:${s(330)};padding:${s(22)} ${s(20)} ${s(8)}}
.lookbook h2{font-size:${s(40)}}
.lookbook .kicker{margin-top:${s(10)}}
.lookbook .desc{font-size:${s(14)};margin-top:${s(10)}}
}`;
  },
  html(C) {
    const k = C.copy;
    return `<div class="scene"><div class="view" role="group" aria-roledescription="carrousel" aria-label="${esc(k.title)}"><div class="sl cur"></div><div class="sl nxt"></div></div>
<div class="side"><span class="idx" aria-live="polite"></span><span class="kicker">${esc(k.title)}</span><h2></h2><p class="desc"></p><p class="meta"></p>
<div class="ctrl"><button type="button" class="arrow prev" aria-label="Image précédente">&#8592;</button><div class="bar"><i></i></div><button type="button" class="arrow next" aria-label="Image suivante">&#8594;</button></div></div></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, RM = C.rm, N = C.items.length, curEl = root.querySelector(".cur"), nxt = root.querySelector(".nxt"), h2 = root.querySelector("h2"), bar = root.querySelector(".bar i"), view = root.querySelector(".view"), page = root.querySelector(".page");
    let i = 0, busy = false, t0 = performance.now(), hold = false, down = null, wheelT = 0;
    const bg = n => "url('" + (C.images[n] || "") + "')";
    function text(n, anim) {
      const it = C.items[n]; root.querySelector(".idx").textContent = H.pad(n + 1) + " / " + H.pad(N); root.querySelector(".desc").textContent = it.desc; root.querySelector(".meta").textContent = it.price;
      h2.setAttribute("aria-label", it.name); h2.innerHTML = "";
      [...it.name].forEach((ch, j) => { const sp = document.createElement("span"); sp.setAttribute("aria-hidden", "true"); sp.textContent = ch; if (anim && !RM) { sp.style.transform = "translateY(110%)"; sp.style.transitionDelay = j * K.STAG + "ms"; } h2.appendChild(sp); });
      if (anim && !RM) requestAnimationFrame(() => requestAnimationFrame(() => h2.querySelectorAll("span").forEach(sp => { sp.style.transform = "none"; })));
    }
    function go(dir) {
      if (busy) return; const n = ((i + dir) % N + N) % N; t0 = performance.now(); text(n, true);
      if (RM) { curEl.style.backgroundImage = bg(n); i = n; return; }
      busy = true; nxt.style.transition = "none"; nxt.style.backgroundImage = bg(n); nxt.style.clipPath = dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)"; curEl.style.transition = "none"; curEl.style.transform = "none";
      nxt.offsetWidth;
      const ease = "cubic-bezier(.77,0,.18,1)"; nxt.style.transition = "clip-path " + K.WIPE + "ms " + ease; nxt.style.clipPath = "inset(0 0 0 0)"; curEl.style.transition = "transform " + K.WIPE + "ms " + ease; curEl.style.transform = "translateX(" + -dir * K.PUSH + "%) scale(" + K.ZOOM + ")";
      setTimeout(() => { if (signal.aborted) return; curEl.style.transition = "none"; curEl.style.backgroundImage = bg(n); curEl.style.transform = "none"; nxt.style.transition = "none"; nxt.style.clipPath = "inset(0 0 0 100%)"; i = n; busy = false; t0 = performance.now(); }, K.WIPE + 30);
    }
    root.querySelector(".next").addEventListener("click", () => go(1), { signal }); root.querySelector(".prev").addEventListener("click", () => go(-1), { signal });
    page.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }, { signal });
    if (C.inter.hover) { view.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") hold = true; }, { signal }); view.addEventListener("pointerleave", () => { hold = false; t0 = performance.now(); }, { signal }); }
    if (C.inter.drag) { view.addEventListener("pointerdown", e => { down = e.clientX; }, { signal }); window.addEventListener("pointerup", e => { if (down == null) return; const dx = (e.clientX - down) / H.zoom(frame); down = null; if (Math.abs(dx) > K.SWIPE) go(dx < 0 ? 1 : -1); }, { signal }); }
    page.addEventListener("wheel", e => { const now = performance.now(); if (now - wheelT < K.WIPE || Math.abs(e.deltaY) < 20) return; wheelT = now; go(e.deltaY > 0 ? 1 : -1); }, { signal, passive: true });
    curEl.style.backgroundImage = bg(0); nxt.style.clipPath = "inset(0 0 0 100%)"; text(0, true);
    if (!RM && view.animate) view.animate([{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }], { duration: K.WIPE, easing: "cubic-bezier(.77,0,.18,1)" });
    let el = 0, lastT = performance.now();
    if (!RM) (function tick(now) { if (signal.aborted) return; const dt = now - lastT; lastT = now; if (busy) el = 0; else if (!hold) el += dt; const q = H.clamp(el / K.AUTO, 0, 1); bar.style.width = q * 100 + "%"; if (q >= 1 && !busy) { el = 0; go(1); } requestAnimationFrame(tick); })(lastT);
  }
};

/* g. Boutique en 3 colonnes */
DEMOS.boutique = {
  css(C) {
    const { s, fs } = u;
    return `
.boutique .col h2{font-family:var(--fd);font-weight:var(--wd);font-size:max(15px,${s(28)});line-height:1.05;letter-spacing:-.01em}
.boutique .left{position:absolute;left:${s(40)};top:${s(104)};width:${s(300)};bottom:${s(64)};display:flex;flex-direction:column;gap:${s(12)};overflow:auto;scrollbar-width:thin;padding:2px}
.boutique .search{width:100%;height:max(26px,${s(38)});border:0;border-bottom:1px solid var(--line);background:transparent;font-size:${fs(13)};padding:0}
.boutique .chips{display:flex;flex-wrap:wrap;gap:${s(6)}}
.boutique .rowi{display:grid!important;grid-template-columns:auto 1fr auto;align-items:center;gap:${s(12)};width:100%;text-align:left;padding:${s(6)}!important;border:1px solid transparent!important;border-radius:8px;font-size:${fs(14)}}
.boutique .rowi .spr{width:max(30px,${s(54)});height:max(30px,${s(54)})}
.boutique .rowi em{font-style:normal;color:var(--text2);font-size:${fs(13)}}
.boutique .rowi[aria-current="true"]{border-color:var(--text)!important;background:var(--ghost)!important}
.boutique .mid{position:absolute;left:${s(380)};top:${s(96)};width:${s(660)};bottom:${s(60)};display:flex;flex-direction:column;align-items:center;perspective:${s(1200)}}
.boutique .hero{width:${s(430)};height:${s(430)};will-change:transform}
.boutique .info{text-align:center;display:flex;flex-direction:column;align-items:center;gap:${s(10)}}
.boutique .info h1{font-family:var(--fd);font-weight:var(--wd);font-size:max(18px,${s(46)});line-height:1;letter-spacing:-.02em}
.boutique .info p{font-size:max(10px,${s(15)});color:var(--text2);max-width:${s(440)}}
.boutique .info .price{font-size:max(11px,${s(18)});font-weight:600}
.boutique .right{position:absolute;left:${s(1080)};top:${s(104)};width:${s(320)};display:flex;flex-direction:column;gap:${s(14)}}
.boutique .lines{display:grid;gap:${s(8)};border-top:1px solid var(--line);padding-top:${s(12)};font-size:${fs(14)};min-height:${s(120)};align-content:start}
.boutique .ln{display:grid;grid-template-columns:1fr auto auto;gap:10px}
.boutique .ln em{font-style:normal;color:var(--text2)}
.boutique .empty{color:var(--text2);font-size:${fs(13)}}
.boutique .tot{display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:${s(12)};font-size:${fs(15)};font-weight:600;font-variant-numeric:tabular-nums}
MQP{
.boutique .mid{left:0;top:${s(60)};width:${s(390)};height:${s(400)};bottom:auto}
.boutique .hero{width:${s(230)};height:${s(230)}}
.boutique .info h1{font-size:${s(26)}}
.boutique .info p{display:none}
.boutique .left{left:${s(16)};top:${s(470)};width:${s(358)};height:${s(190)};bottom:auto}
.boutique .left h2{display:none}
.boutique .right{left:${s(16)};top:${s(672)};width:${s(358)};gap:${s(8)}}
.boutique .right h2,.boutique .lines{display:none}
.boutique .cta{height:${s(42)};font-size:${s(12)}}
.boutique .dot{width:${s(24)};height:${s(24)}}
}`;
  },
  html(C) {
    const k = C.copy, tags = [...new Set(C.items.map(i => i.tag).filter(Boolean))];
    return `<div class="scene">
<section class="col left" aria-label="${esc(k.shopTitle)}"><h2>${esc(k.shopTitle)}</h2>
${C.inter.search ? `<input class="search" type="search" placeholder="${esc(k.search)}" aria-label="${esc(k.search)}">` : ""}
${C.inter.filters ? `<div class="chips" role="group" aria-label="Filtres"><button type="button" class="pill" data-f="" aria-pressed="true">${esc(k.filterAll)}</button>${tags.map(t => `<button type="button" class="pill" data-f="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>` : ""}
<div class="list">${C.items.map((it, i) => `<button type="button" class="rowi" data-i="${i}" data-tag="${esc(it.tag)}" aria-current="${i === 0}"><span class="spr" style="background-position:${it.colors[0].pos}"></span><span>${esc(it.name)}</span><em>${esc(it.price)}</em></button>`).join("")}</div></section>
<section class="mid" aria-live="polite"><div class="hero spr"></div><div class="info"><h1></h1><p></p><span class="price"></span><div class="swbox"></div></div></section>
<section class="col right" aria-label="${esc(k.recapTitle)}"><h2>${esc(k.recapTitle)}</h2><div class="lines"></div>
<div class="tot"><span>${esc(k.total)}</span><span class="sum"></span></div>${C.inter.cart ? `<button type="button" class="cta add">${esc(k.cta)}</button>` : ""}</section></div>`;
  },
  run(root, frame, C, H, signal) {
    const K = C.K, RM = C.rm, rows = [...root.querySelectorAll(".rowi")], hero = root.querySelector(".hero"), info = root.querySelector(".info"), mid = root.querySelector(".mid"), lines = root.querySelector(".lines"), sumEl = root.querySelector(".sum"), countEl = root.querySelector(".count");
    let cur = 0, col = C.items.map(() => 0), cart = [], mx = .5, my = .5, rx = 0, ry = 0, sum = 0, sFrom = 0, sTo = 0, sT0 = 0, last = performance.now(); const t0 = last;
    function fill() {
      const it = C.items[cur]; hero.style.backgroundPosition = it.colors[col[cur]].pos; info.querySelector("h1").textContent = it.name; info.querySelector("p").textContent = it.desc; info.querySelector(".price").textContent = it.price;
      const box = info.querySelector(".swbox"); box.innerHTML = "";
      if (C.inter.swatches && it.colors.length > 1) { box.innerHTML = '<div class="sw" role="radiogroup" aria-label="Coloris">' + it.colors.map((c, j) => '<button type="button" class="dot" role="radio" aria-checked="' + (j === col[cur]) + '" aria-label="' + c.name.replace(/"/g, "") + '" data-j="' + j + '" style="background:' + c.hex + '"></button>').join("") + "</div>"; box.querySelectorAll(".dot").forEach(b => b.addEventListener("click", () => { col[cur] = +b.dataset.j; fill(); })); }
    }
    function pick(i) {
      if (i === cur) return; rows.forEach((r, j) => r.setAttribute("aria-current", j === i));
      if (RM || !hero.animate) { cur = i; return fill(); }
      const out = [hero, info].map(el => el.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(20px)" }], { duration: K.OUT, easing: "ease-in", fill: "forwards" }));
      out[0].onfinish = () => { cur = i; fill(); out.forEach(a => a.cancel()); [hero, info].forEach(el => el.animate([{ opacity: 0, transform: "translateY(-20px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: K.IN, easing: "cubic-bezier(.22,1,.36,1)" })); };
    }
    function drawCart() {
      lines.innerHTML = cart.length ? "" : '<span class="empty"></span>'; if (!cart.length) lines.firstChild.textContent = C.copy.empty || "";
      cart.forEach(l => { const d = document.createElement("div"); d.className = "ln"; const a = document.createElement("span"), b = document.createElement("em"), c = document.createElement("span"); a.textContent = l.name; b.textContent = "x " + l.q; c.textContent = l.price; d.append(a, b, c); lines.appendChild(d); });
      sFrom = sum; sTo = cart.reduce((t, l) => t + H.price(l.price) * l.q, 0); sT0 = performance.now();
      if (countEl) { countEl.textContent = cart.reduce((t, l) => t + l.q, 0); H.bump(countEl); }
    }
    rows.forEach((r, i) => r.addEventListener("click", () => pick(i), { signal }));
    const add = root.querySelector(".add"); if (add) add.addEventListener("click", () => { const it = C.items[cur], l = cart.find(x => x.name === it.name); if (l) l.q++; else cart.push({ name: it.name, price: it.price, q: 1 }); drawCart(); }, { signal });
    const search = root.querySelector(".search"); let fq = "", ff = "";
    const filt = () => rows.forEach(r => { const ok = r.children[1].textContent.toLowerCase().includes(fq) && (!ff || r.dataset.tag === ff); if (ok && r.style.display === "none" && !RM && r.animate) r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: K.FLIP }); r.style.display = ok ? "" : "none"; });
    if (search) search.addEventListener("input", () => { fq = search.value.trim().toLowerCase(); filt(); }, { signal });
    root.querySelectorAll(".chips .pill").forEach(p => p.addEventListener("click", () => { ff = p.dataset.f; root.querySelectorAll(".chips .pill").forEach(x => x.setAttribute("aria-pressed", x === p)); filt(); }, { signal }));
    if (C.inter.hover) { mid.addEventListener("pointermove", e => { const r = mid.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; }, { signal }); mid.addEventListener("pointerleave", () => { mx = my = .5; }, { signal }); }
    fill(); drawCart(); sum = sTo;
    sumEl.textContent = H.money(0, C.items[0].price);
    if (!RM && hero.animate) { hero.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1)" }], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" }); rows.forEach((r, i) => r.animate([{ opacity: 0, transform: "translateX(-16px)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: 150 + i * 50, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" })); }
    (function tick(now) {
      if (signal.aborted) return; const dt = Math.min(.05, (now - last) / 1000); last = now; const s = root.querySelector(".scene").offsetWidth / (H.portrait(frame) ? 390 : 1440), t = (now - t0) / 1000, kf = RM ? 1 : 1 - Math.pow(K.DAMP, dt * 60);
      ry += ((mx - .5) * K.TILTY - ry) * kf; rx += (-(my - .5) * K.TILTX - rx) * kf;
      hero.style.transform = "translateY(" + (RM ? 0 : K.FLOAT * Math.sin(t * K.FLOATF)) * s + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      if (sum !== sTo) { const q = RM ? 1 : H.clamp((now - sT0) / K.COUNT, 0, 1); sum = q >= 1 ? sTo : H.lerp(sFrom, sTo, H.eo(q)); sumEl.textContent = H.money(Math.round(sum), C.items[0].price); }
      requestAnimationFrame(tick);
    })(last);
  }
};

/* ---------- montage en ligne (shadow DOM) et export autonome ---------- */
function mountDemo(host, C) {
  host.innerHTML = "";
  const holder = document.createElement("div"); host.appendChild(holder);
  const sh = holder.attachShadow({ mode: "open" });
  sh.innerHTML = `<style>:host{display:block;width:100%;height:100%}${demoCSS(C, true)}</style><div class="frame">${demoHTML(C)}</div>`;
  const ctl = new AbortController();
  try { DEMOS[C.arch].run(sh, sh.querySelector(".frame"), C, H, ctl.signal); } catch (e) { console.error("Gabarit", e); }
  return () => ctl.abort();
}
function demoDoc(C) {
  const helpers = "{" + Object.keys(H).map(k => JSON.stringify(k) + ":" + H[k].toString()).join(",") + "}";
  const json = JSON.stringify(Object.assign({}, C, { sprite: "" })).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(C.meta.title)}</title><meta name="description" content="${esc(C.meta.desc)}">
<link rel="stylesheet" href="${esc(C.fontsURL)}">
<style>html,body{height:100%;margin:0;overflow:hidden}.frame{position:fixed!important;inset:0}${demoCSS(C, false)}</style></head>
<body><div class="frame">${demoHTML(C)}</div>
<script>(function(){var H=${helpers};var C=${json};C.rm=!!C.inter.reduced&&matchMedia("(prefers-reduced-motion: reduce)").matches;var run=${DEMOS[C.arch].run.toString().replace(/^run/, "function")};run(document,document.querySelector(".frame"),C,H,new AbortController().signal);})();<\/script>
</body></html>`;
}
