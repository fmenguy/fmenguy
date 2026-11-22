/* ---------- application ---------- */
const DRAFT_KEY = "atelier-motion-site-v1";
let state = null, manual = false, lastRes = null, lastCheck = null;
const view = { tab: "prompt", src: "demo", vp: "land", rm: false, full: false };
const probes = new Map();       // url -> "ok" | "ko" | "wait"
const cache = {};               // visuels de remplacement mémorisés
const ai = { html: "", raw: "", ctl: null, busy: false, lastPrompt: "", ready: false, timer: 0 };
let sample = null, downloads = null, destroyDemo = null;

const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); };
const fid = p => "f-" + p.replace(/[^a-z0-9]+/gi, "-");
const F = (label, path, o = {}) => `<label class="f ${o.cls || ""}"><span>${label}</span>${o.area
  ? `<textarea id="${fid(path)}" data-p="${path}" rows="${o.rows || 2}">${esc(getP(state, path))}</textarea>`
  : `<input id="${fid(path)}" type="${o.type || "text"}" data-p="${path}" value="${esc(getP(state, path))}" ${o.attr || ""}>`}</label>`;

/* ----- résolution des visuels : fichier téléversé, URL chargeable, sinon remplacement dessiné ----- */
function probe(url) {
  if (!url || isData(url)) return "ok";
  if (probes.has(url)) return probes.get(url);
  probes.set(url, "wait");
  if (/\.example(\/|$)/.test(url)) { probes.set(url, "ko"); return "ko"; }
  const im = new Image();
  im.onload = () => { probes.set(url, "ok"); if (url === state.assets.sprite.url && !state.assets.sprite.data) { state.assets.sprite.w = im.naturalWidth; state.assets.sprite.h = im.naturalHeight; } update(true); };
  im.onerror = () => { probes.set(url, "ko"); update(true); };
  im.src = url;
  return "wait";
}
const usable = o => (o && o.data) || (o && o.url && probe(o.url) === "ok" ? o.url : "");
function memo(key, sig, make) { if (!cache[key] || cache[key].sig !== sig) cache[key] = { sig, val: make() }; return cache[key].val; }
function resolveAssets(st) {
  const a = st.assets, kind = ARCH[st.arch].assets, res = { notes: [] };
  const own = usable(a.sprite);
  res.sprite = own || memo("sprite", JSON.stringify([st.items.map(i => [i.shape, i.colors]), a.sprite.cols, a.sprite.rows]), () => makeSprite(st.items, a.sprite.cols, a.sprite.rows));
  res.spriteOwn = !!own;
  if (kind === "sprite" && !own) res.notes.push(a.sprite.url ? "L'URL de la feuille de sprites ne se charge pas ici : visuels de remplacement." : "Aucune feuille de sprites fournie : visuels de remplacement.");
  if (kind === "images") {
    let miss = 0;
    res.images = st.items.map((it, i) => usable(a.images[i]) || (miss++, memo("photo" + i, JSON.stringify([it.shape, it.colors[0], i]), () => makePhoto(i, it, st.tokens))));
    if (miss) res.notes.push(miss + " image(s) de remplacement.");
  }
  if (kind === "variants") {
    const photos = Array.from({ length: 9 }, (_, i) => usable(a.variants[i]));
    if (photos.every(Boolean)) {
      res.photos = photos; res.tw = a.vw; res.th = a.vh; res.masks = a.masks.length === 8 ? a.masks.map(m => m.data) : []; res.ownPhotos = true;
      if (!res.masks.length) res.notes.push("Photos fournies mais masques absents : aucune pièce ne peut être mélangée.");
    } else {
      const ph = memo("tryon", JSON.stringify(st.tryon.slots.map(s => s.opts.map(o => o.hex))), () => makeTryon(st.tryon));
      res.photos = ph.photos; res.masks = ph.masks; res.tw = ph.w; res.th = ph.h; res.demoMasks = true;
      res.notes.push("Mannequin et masques de remplacement, dessinés par l'outil.");
    }
    res.room = usable(a.ar) || memo("room", "1", () => makeRoom());
  }
  return res;
}

/* ----- étapes du formulaire ----- */
const STEPS = [
  ["Marque", renderBrand], ["Archétype", renderArch], ["Assets", renderAssets], ["Palette", renderStyle], ["Interactions", renderInter], ["Contenu", renderContent]
];
function renderSteps() {
  $("#steps").innerHTML = STEPS.map(([t], i) => `<li><button type="button" data-step="${i}" class="${i < state.step ? "done" : ""}" ${i === state.step ? 'aria-current="step"' : ""}><span class="n">${i + 1} / 6</span><span class="t">${t}</span></button></li>`).join("");
  $("#stepcount").textContent = "Étape " + (state.step + 1) + " sur 6";
  $("#prev").disabled = state.step === 0;
  $("#next").textContent = state.step === 5 ? "Voir le résultat" : "Suivant";
}
function renderPanel() { $("#panel").innerHTML = STEPS[state.step][1](); renderSteps(); refreshLive(); }

function renderBrand() {
  return `<h2>La marque</h2><p class="lead">Quatre lignes suffisent. Elles donnent le ton du prompt et les textes par défaut.</p>
<div class="grid2">${F("Nom fictif", "brand.name", { attr: 'maxlength="40" autocomplete="off"' })}${F("Secteur", "brand.sector")}${F("Ton", "brand.tone")}${F("Public", "brand.audience")}</div>
<div id="brand-note"></div>
<p class="note">Règle imposée : jamais de marque réelle. L'outil compare le nom et les textes à une liste de marques connues et bloque la validation si l'une d'elles apparaît.</p>`;
}
function renderArch() {
  return `<h2>L'archétype de motion</h2><p class="lead">Chaque archétype apporte son moteur de mouvement, avec ses formules et ses constantes, et sa méthode d'assets.</p>
<div class="archs" role="radiogroup" aria-label="Archétype de motion">${ARCH_ORDER.map(id => { const A = ARCH[id]; return `<label class="arch"><input type="radio" name="arch" id="arch-${id}" value="${id}" data-p="arch" data-rr="1" ${state.arch === id ? "checked" : ""}>
<div class="th th-${A.th}" aria-hidden="true">${"<i></i>".repeat(A.n)}</div><span class="ref">${A.l}. ${A.ref}</span><b>${A.name}</b><small>${A.desc}</small></label>`; }).join("")}</div>
<p class="note">Méthode d'assets de cet archétype : ${{ sprite: "une feuille de sprites unique, recadrée en CSS.", variants: "neuf photos alignées et huit masques doux, mélangés dans un canvas.", images: "une image plein cadre par entrée." }[ARCH[state.arch].assets]}${state.arch === "vhs" ? ' Cet archétype attend une palette sombre. <button type="button" class="btn sm" data-act="dark">Appliquer une palette sombre</button>' : ""}</p>`;
}
function renderAssets() {
  const a = state.assets, kind = ARCH[state.arch].assets;
  let h = `<h2>Les assets</h2><p class="lead">On ne demande jamais à l'IA de générer ou d'inventer des images. On lui fournit des visuels préparés, et on lui dit exactement comment les recadrer.</p>
<ol class="lesson">
<li><span><b>Feuille de sprites.</b> Grille régulière de cellules carrées, produits en colonnes, coloris en lignes, fond transparent. L'outil calcule background-size et background-position pour chaque cellule.</span></li>
<li><span><b>Variantes alignées.</b> Photos de même taille et de même cadrage, une seule différence par variante. Notez le haut de la tête et les pieds en pourcentage de la hauteur.</span></li>
<li><span><b>Masques.</b> Un par variante, PNG RGBA avec un flou de 4 à 10 px, intégrés en data URI.</span></li>
<li><span><b>Filtre de nettoyage de l'alpha.</b> Un filtre SVG feComponentTransfer, slope 1.1, intercept -0.1, appliqué à chaque calque détouré.</span></li>
<li><span><b>Une URL, une seule fois.</b> Chaque URL d'image est stockée dans une variable CSS ou une constante JS, puis réutilisée.</span></li>
</ol>`;
  if (kind === "sprite") {
    h += `<h3>Votre feuille de sprites</h3>
<div class="grid2">${F("URL de la feuille (PNG transparent)", "assets.sprite.url", { cls: "wide", type: "url", attr: 'placeholder="https://"' })}</div>
<div class="row" style="margin-top:10px"><label class="btn sm filebtn">Téléverser un fichier<input type="file" id="up-sprite" accept="image/png,image/webp" data-up="sprite"></label>${a.sprite.data ? `<span class="mono">${esc(a.sprite.name)}</span><button type="button" class="btn sm ghost" data-act="clear-sprite">Retirer</button>` : ""}</div>
<div class="grid4" style="margin-top:12px">${F("Colonnes", "assets.sprite.cols", { type: "number", attr: 'min="1" max="12" data-rr="1"' })}${F("Lignes", "assets.sprite.rows", { type: "number", attr: 'min="1" max="12" data-rr="1"' })}${F("Largeur (px)", "assets.sprite.w", { type: "number", attr: 'min="1"' })}${F("Hauteur (px)", "assets.sprite.h", { type: "number", attr: 'min="1"' })}</div>
<ul class="checks" id="asset-checks"></ul>
<h3>Recadrage calculé</h3><pre class="code" id="sprite-code"></pre><div class="cells" id="cells"></div>`;
  } else if (kind === "variants") {
    h += `<h3>Vos 9 photos alignées</h3>
<label class="f"><span>URL des photos, une par ligne, la base en premier puis chaussures 1 et 2, jupe 1 et 2, haut 1 et 2, sac 1 et 2</span><textarea id="f-variants-urls" data-urls="variants" rows="5" spellcheck="false">${esc(a.variants.map(v => v.url || "").join("\n"))}</textarea></label>
<div class="row" style="margin-top:10px"><label class="btn sm filebtn">Téléverser les 9 photos<input type="file" id="up-variants" accept="image/png,image/webp" multiple data-up="variants"></label><label class="btn sm filebtn">Téléverser les 8 masques<input type="file" id="up-masks" accept="image/png" multiple data-up="masks"></label><button type="button" class="btn sm" data-act="gen-masks">Calculer les masques par différence</button></div>
<div class="grid4" style="margin-top:12px">${F("Largeur (px)", "assets.vw", { type: "number", attr: 'min="1"' })}${F("Hauteur (px)", "assets.vh", { type: "number", attr: 'min="1"' })}${F("Haut de la tête (%)", "assets.head", { type: "number", attr: 'min="0" max="100" step="0.5"' })}${F("Pieds (%)", "assets.feet", { type: "number", attr: 'min="0" max="100" step="0.5"' })}</div>
<div class="grid2" style="margin-top:12px">${F("Flou des masques (4 à 10 px)", "assets.blur", { type: "number", attr: 'min="4" max="10"' })}${eff(state).ar ? F("URL de la photo de fond du mode AR", "assets.ar.url", { type: "url" }) : ""}</div>
${eff(state).ar ? `<div class="row" style="margin-top:10px"><label class="btn sm filebtn">Téléverser la photo de fond<input type="file" id="up-ar" accept="image/*" data-up="ar"></label>${a.ar.data ? `<span class="mono">${esc(a.ar.name)}</span>` : ""}</div>` : ""}
<ul class="checks" id="asset-checks"></ul>
<h3>Photos et masques utilisés par l'aperçu</h3><div class="thumbs" id="thumbs"></div>`;
  } else {
    h += `<h3>Vos images</h3>
<label class="f"><span>URL des images, une par ligne, dans l'ordre des entrées de l'étape Contenu</span><textarea id="f-images-urls" data-urls="images" rows="5" spellcheck="false">${esc(state.items.map((_, i) => (a.images[i] || {}).url || "").join("\n"))}</textarea></label>
<div class="row" style="margin-top:10px"><label class="btn sm filebtn">Téléverser les images<input type="file" id="up-images" accept="image/*" multiple data-up="images"></label></div>
<div class="grid4" style="margin-top:12px">${F("Largeur (px)", "assets.iw", { type: "number", attr: 'min="1"' })}${F("Hauteur (px)", "assets.ih", { type: "number", attr: 'min="1"' })}</div>
<ul class="checks" id="asset-checks"></ul>
<h3>Images utilisées par l'aperçu</h3><div class="thumbs" id="thumbs" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))"></div>`;
  }
  h += `<h3>Filtre à copier dans la page</h3><pre class="code">${esc(FILTER_SVG.replace(/></g, ">\n<"))}\n\n.calque-detoure { filter: url(#alpha-clean); }</pre>
<details class="more"><summary>Préparer les visuels en amont : prompt Flux.dev</summary><p class="note">Facultatif. Ce prompt sert à produire vos visuels avant de venir ici, jamais à l'IA de code. Détourez ensuite le fond et vérifiez l'alignement.</p><pre class="code" id="flux" style="white-space:pre-wrap"></pre><div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="copy-flux">Copier le prompt Flux</button></div></details>`;
  return h;
}
function fluxPrompt() {
  const a = state.assets, kind = ARCH[state.arch].assets, sector = state.brand.sector || "fashion";
  if (kind === "sprite") return `Product sprite sheet, strict ${a.sprite.cols} by ${a.sprite.rows} grid of perfectly square cells with equal gutters, one single ${sector} product centered in each cell at identical scale, columns show different products (${state.items.map(i => SHAPE_NAMES[i.shape] || i.name).join(", ")}), rows show colorways of the same product, flat lay front view, soft even studio lighting from above, plain uniform light gray background for clean cutout, no text, no logos, no labels, no props, no shadows crossing cell borders, crisp fabric texture, commercial e-commerce product photography, sharp focus\n\nSettings: aspect ratio ${a.sprite.cols}:${a.sprite.rows}, guidance 3.5, steps 28, then remove the background and resize to ${a.sprite.w} x ${a.sprite.h} px.`;
  if (kind === "variants") return `Full body studio fashion photograph of a model standing straight and facing the camera, arms slightly away from the body, neutral relaxed pose, feet flat on the floor, locked tripod camera at chest height, 85mm lens, soft diffused key light, plain uniform light gray seamless background for clean cutout, wearing ${state.tryon.slots.map(s => s.opts[0].name).join(", ")}, head near the top edge and feet near the bottom edge of the frame, no text, no logos, sharp focus, editorial e-commerce look\n\nSettings: aspect ratio 2:3, guidance 3.5, steps 28. Generate the base image once, then create each variant with inpainting restricted to one garment zone so every other pixel stays aligned.`;
  return `Editorial ${sector} campaign photograph, single subject, strong directional light, generous negative space on one side for cropping, cinematic color grade, natural skin and fabric texture, shallow depth of field, no text, no logos, no watermark, sharp focus on the subject\n\nSettings: aspect ratio 16:10, guidance 3.5, steps 28, export at ${a.iw} x ${a.ih} px. Repeat with the same lighting and grade for the ${state.items.length} entries.`;
}
function renderStyle() {
  const fsel = (path, cur) => `<select id="${fid(path)}" data-p="${path}" data-rr="1">${Object.keys(FONTS).map(f => `<option ${f === cur ? "selected" : ""}>${f}</option>`).join("")}</select>`;
  const wsel = role => `<div class="weights" role="group" aria-label="Graisses">${FONTS[state.fonts[role].family].w.map(w => `<label><input type="checkbox" id="w-${role}-${w}" data-w="${role}" value="${w}" ${state.fonts[role].weights.includes(w) ? "checked" : ""}>${w}</label>`).join("")}</div>`;
  return `<h2>Palette et typographie</h2><p class="lead">Six tokens de couleur, chacun avec un rôle, et une ou deux familles Google Fonts. Le validateur mesure le contraste entre les paires qui portent du texte.</p>
<div class="tokens">${TOKENS.map(t => `<div class="tok"><input type="color" id="c-${t.k}" data-p="tokens.${t.k}" value="${esc(state.tokens[t.k])}" aria-label="${t.l}, sélecteur"><label for="h-${t.k}">${t.l}</label><input type="text" id="h-${t.k}" data-p="tokens.${t.k}" data-hex="1" value="${esc(state.tokens[t.k])}" maxlength="7" spellcheck="false"></div>`).join("")}</div>
<h3>Contraste</h3><div style="overflow-x:auto"><table class="contrast" id="contrast"></table></div>
<h3>Polices</h3>
<div class="grid2"><label class="f"><span>Famille des titres</span>${fsel("fonts.display.family", state.fonts.display.family)}</label><label class="f"><span>Famille du texte</span>${fsel("fonts.body.family", state.fonts.body.family)}</label>
<div class="f"><span>Graisses des titres</span>${wsel("display")}</div><div class="f"><span>Graisses du texte</span>${wsel("body")}</div></div>
<div class="sample" id="type-sample"></div>`;
}
function renderInter() {
  const uses = ARCH[state.arch].uses;
  return `<h2>Les interactions</h2><p class="lead">Cochez ce que la page doit savoir faire. Ce qui n'est pas coché est écrit dans le prompt comme hors périmètre.</p>
<div class="toggles">${INTER.map(i => { const on = uses.includes(i.k); return `<label class="tg ${on ? "" : "off"}"><input type="checkbox" id="i-${i.k}" data-p="inter.${i.k}" ${state.inter[i.k] ? "checked" : ""} ${on ? "" : "disabled"}><b>${i.l}</b><small>${on ? i.d : "Sans objet pour cet archétype."}</small></label>`; }).join("")}</div>`;
}
function renderContent() {
  const kind = ARCH[state.arch].assets;
  let h = `<h2>Le contenu</h2><p class="lead">Les textes exacts de l'interface. Le prompt les reprend dans une liste fermée, et rien d'autre ne doit apparaître à l'écran.</p>
<h3>Interface</h3><div class="grid2">${copyFields(state).map(c => F(c.l, "copy." + c.k)).join("")}</div>
<h3>Balises du head</h3><div class="grid2">${F("Title", "meta.title")}${F("Meta description", "meta.desc")}</div>`;
  if (state.arch === "tryon") {
    h += `<h3>Pièces par zone</h3><p class="note" style="margin:0 0 10px">La première pièce de chaque zone est celle de la photo de base. Les points servent au score de style.</p>`;
    state.tryon.slots.forEach((sl, si) => {
      h += `<div class="item"><div class="item-h"><b>Zone ${si + 1}</b></div>${F("Nom de la zone", `tryon.slots.${si}.label`)}
<div class="colhead t4"><span></span><span>Nom</span><span>Prix</span><span>Points</span></div><div class="colors">${sl.opts.map((o, v) => `<div class="color t4"><input type="color" id="tc-${si}-${v}" data-p="tryon.slots.${si}.opts.${v}.hex" value="${esc(o.hex)}" aria-label="Pastille"><input type="text" id="tn-${si}-${v}" data-p="tryon.slots.${si}.opts.${v}.name" value="${esc(o.name)}" aria-label="Nom"><input type="text" id="tp-${si}-${v}" data-p="tryon.slots.${si}.opts.${v}.price" value="${esc(o.price)}" aria-label="Prix"><input type="number" id="ts-${si}-${v}" data-p="tryon.slots.${si}.opts.${v}.pts" value="${esc(o.pts)}" min="0" max="30" aria-label="Points"></div>`).join("")}</div></div>`;
    });
    h += `<h3>Looks du styliste</h3>`;
    state.tryon.looks.forEach((l, li) => {
      h += `<div class="item">${F("Nom du look " + (li + 1), `tryon.looks.${li}.name`)}<div class="grid4">${state.tryon.slots.map((sl, si) => `<label class="f"><span>${esc(sl.label)}</span><select id="lk-${li}-${si}" data-p="tryon.looks.${li}.pick.${si}" data-num="1">${sl.opts.map((o, v) => `<option value="${v}" ${l.pick[si] === v ? "selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>`).join("")}</div></div>`;
    });
  } else {
    h += `<h3>${kind === "sprite" ? "Produits" : "Entrées"}</h3>`;
    state.items.forEach((it, i) => {
      h += `<div class="item"><div class="item-h"><b>${kind === "sprite" ? "Produit" : "Entrée"} ${i + 1}</b><button type="button" class="x" data-act="del-item" data-i="${i}" aria-label="Supprimer">&times;</button></div>
<div class="grid3">${F("Nom", `items.${i}.name`)}${F(kind === "sprite" ? "Prix" : "Prix ou méta", `items.${i}.price`)}${F("Catégorie", `items.${i}.tag`)}</div>${F("Description", `items.${i}.desc`)}`;
      h += `<div class="grid2"><label class="f"><span>Forme du visuel de remplacement</span><select id="${fid(`items.${i}.shape`)}" data-p="items.${i}.shape">${SHAPE_ORDER.map(s => `<option value="${s}" ${it.shape === s ? "selected" : ""}>${SHAPE_NAMES[s]}</option>`).join("")}</select></label></div>`;
      if (kind === "sprite") h += `<div class="colhead"><span></span><span>Coloris</span><span>Col.</span><span>Ligne</span><span></span></div><div class="colors">${it.colors.map((c, j) => `<div class="color"><input type="color" id="cc-${i}-${j}" data-p="items.${i}.colors.${j}.hex" value="${esc(c.hex)}" aria-label="Pastille"><input type="text" id="cn-${i}-${j}" data-p="items.${i}.colors.${j}.name" value="${esc(c.name)}" aria-label="Nom du coloris"><input type="number" id="cx-${i}-${j}" data-p="items.${i}.colors.${j}.col" value="${c.col}" min="0" max="11" aria-label="Colonne"><input type="number" id="cy-${i}-${j}" data-p="items.${i}.colors.${j}.row" value="${c.row}" min="0" max="11" aria-label="Ligne"><button type="button" class="x" data-act="del-color" data-i="${i}" data-j="${j}" aria-label="Supprimer le coloris">&times;</button></div>`).join("")}</div><div class="row"><button type="button" class="btn sm ghost" data-act="add-color" data-i="${i}">Ajouter un coloris</button></div>`;
      h += `</div>`;
    });
    h += `<div class="row"><button type="button" class="btn sm" data-act="add-item">Ajouter ${kind === "sprite" ? "un produit" : "une entrée"}</button>${kind === "sprite" ? `<button type="button" class="btn sm ghost" data-act="auto-cells">Répartir : produits en colonnes, coloris en lignes</button>` : ""}</div>`;
  }
  return h;
}

/* ----- parties vivantes du panneau ----- */
function spriteChecks() {
  const sp = state.assets.sprite, out = [], st = sp.data ? "file" : sp.url ? probe(sp.url) : "none";
  if (st === "file") out.push(["ok", `Fichier téléversé : ${sp.name}, ${sp.w} par ${sp.h} px.`]);
  else if (st === "ok") out.push(["ok", "L'URL se charge : " + sp.w + " par " + sp.h + " px."]);
  else if (st === "wait") out.push(["info", "Vérification de l'URL en cours."]);
  else if (st === "ko") out.push(["warn", "L'URL ne se charge pas depuis cette page (les artefacts bloquent les images externes, et les URL en .example sont fictives). Le prompt garde votre URL ; l'aperçu dessine des visuels de remplacement. Téléversez le fichier pour le contrôler ici."]);
  else out.push(["err", "Aucune URL : le validateur signalera « URL absente »."]);
  const cw = sp.w / sp.cols, ch = sp.h / sp.rows;
  out.push(cw === ch && Number.isInteger(cw) ? ["ok", `Cellules carrées de ${cw} px.`] : ["err", `Cellules de ${+cw.toFixed(2)} par ${+ch.toFixed(2)} px : elles doivent être carrées et entières. Vérifiez la grille ou les dimensions.`]);
  const outside = [], seen = {}, dup = [];
  state.items.forEach(it => it.colors.forEach(c => { if (c.col >= sp.cols || c.row >= sp.rows || c.col < 0 || c.row < 0) outside.push(it.name + " / " + c.name); const k = c.col + "," + c.row; if (seen[k]) dup.push(k); seen[k] = 1; }));
  out.push(outside.length ? ["err", "Cellules hors grille : " + outside.join(" ; ") + "."] : ["ok", `${Object.keys(seen).length} cellules utilisées sur ${sp.cols * sp.rows}.`]);
  if (dup.length) out.push(["warn", "Cellules utilisées deux fois : " + [...new Set(dup)].join(" ; ") + "."]);
  if (sp.alpha) { out.push(sp.alpha.opaque ? ["warn", sp.alpha.opaque + " cellule(s) ont un coin opaque : le fond n'est pas transparent partout."] : ["ok", "Coins de cellules transparents."]); const empt = Object.keys(seen).filter(k => sp.alpha.empty.includes(k)); if (empt.length) out.push(["warn", "Cellules utilisées mais vides dans le fichier : " + empt.join(" ; ") + "."]); }
  else if (st !== "file") out.push(["info", "Transparence non contrôlée : téléversez le fichier pour la vérifier."]);
  out.push(["ok", "L'URL est déclarée une seule fois, dans --sprite."]);
  return out;
}
function variantChecks() {
  const a = state.assets, out = [], n = a.variants.filter(v => v.url || v.data).length;
  out.push(n === 9 ? ["ok", "9 photos déclarées."] : [n ? "err" : "warn", n + " photo(s) déclarée(s), 9 attendues. L'aperçu utilise le mannequin de remplacement."]);
  const dims = a.variants.filter(v => v.w).map(v => v.w + "x" + v.h);
  if (dims.length) out.push(new Set(dims).size === 1 ? ["ok", "Toutes les photos téléversées font " + dims[0].replace("x", " par ") + " px."] : ["err", "Tailles différentes : " + [...new Set(dims)].join(", ") + ". Les variantes doivent être alignées au pixel près."]);
  else out.push(["info", "Alignement non contrôlé : téléversez les photos pour comparer leurs tailles."]);
  out.push(a.masks.length === 8 ? ["ok", "8 masques en data URI."] : lastRes && lastRes.demoMasks ? ["warn", "Masques de remplacement : ils correspondent au mannequin dessiné, pas à vos photos."] : ["err", a.masks.length + " masque(s), 8 attendus."]);
  if (a.masks.some(m => m.flat)) out.push(["warn", "Un masque au moins est sans transparence : l'alpha doit porter le poids de la zone."]);
  out.push(a.head > 0 && a.feet > a.head && a.feet <= 100 ? ["ok", `Repères : tête à ${a.head} %, pieds à ${a.feet} %.`] : ["err", "Repères incohérents : la tête doit être au dessus des pieds, entre 0 et 100 %."]);
  out.push(a.blur >= 4 && a.blur <= 10 ? ["ok", `Flou des masques : ${a.blur} px.`] : ["err", "Le flou des masques doit rester entre 4 et 10 px."]);
  return out;
}
function imageChecks() {
  const a = state.assets, n = state.items.filter((_, i) => a.images[i] && (a.images[i].url || a.images[i].data)).length;
  return [n === state.items.length ? ["ok", n + " images pour " + n + " entrées."] : ["err", n + " image(s) pour " + state.items.length + " entrées."], lastRes && lastRes.notes.length ? ["warn", lastRes.notes.join(" ")] : ["ok", "Toutes les images se chargent ici."]];
}
function refreshLive() {
  const P = $("#panel"); if (!P || !state) return;
  const bn = $("#brand-note"); if (bn) { const rb = realBrandIn(state.brand.name); bn.innerHTML = rb ? `<p class="note err">« ${esc(state.brand.name)} » contient une marque réelle (${esc(rb)}). Choisissez un nom fictif.</p>` : state.brand.name.trim() ? `<p class="note ok">Nom accepté : aucune marque connue détectée.</p>` : `<p class="note err">Donnez un nom à la marque.</p>`; }
  const ck = $("#asset-checks"); if (ck) { const kind = ARCH[state.arch].assets, list = kind === "sprite" ? spriteChecks() : kind === "variants" ? variantChecks() : imageChecks(); ck.innerHTML = list.map(([l, t]) => `<li><span class="pill ${l}">${{ ok: "OK", warn: "À voir", err: "Erreur", info: "Info" }[l]}</span><span>${esc(t)}</span></li>`).join(""); }
  const cells = $("#cells"); if (cells && lastRes) {
    const sp = state.assets.sprite; cells.style.gridTemplateColumns = `repeat(${sp.cols},minmax(0,1fr))`;
    let h = ""; for (let r = 0; r < sp.rows; r++) for (let c = 0; c < sp.cols; c++) { const pos = cellPos(sp, { col: c, row: r }); h += `<div class="cell" style="background-image:url('${lastRes.sprite}');background-size:${sp.cols * 100}% ${sp.rows * 100}%;background-position:${pos}"><span>${pos}</span></div>`; }
    cells.innerHTML = h;
    $("#sprite-code").textContent = `:root { --sprite: url("${assetURLs(state).sprite}"); }\n.visuel {\n  background-image: var(--sprite);\n  background-repeat: no-repeat;\n  background-size: ${sp.cols * 100}% ${sp.rows * 100}%;\n  background-position: X% Y%;   /* X = colonne / ${Math.max(1, sp.cols - 1)} × 100 ; Y = ligne / ${Math.max(1, sp.rows - 1)} × 100 */\n}`;
  }
  const th = $("#thumbs"); if (th && lastRes) {
    if (ARCH[state.arch].assets === "variants") th.innerHTML = lastRes.photos.map((p, i) => `<figure><img src="${p}" alt=""><figcaption>photo ${i}</figcaption></figure>`).join("") + lastRes.masks.map((m, i) => `<figure><img src="${m}" alt="" style="background:#222"><figcaption>masque ${i + 1}</figcaption></figure>`).join("");
    else th.innerHTML = (lastRes.images || []).map((p, i) => `<figure><img src="${p}" alt="" style="aspect-ratio:16/10;object-fit:cover"><figcaption>${esc(state.items[i].name)}</figcaption></figure>`).join("");
  }
  const fx = $("#flux"); if (fx) fx.textContent = fluxPrompt();
  const ct = $("#contrast"); if (ct) {
    const t = state.tokens;
    ct.innerHTML = CONTRAST_RULES.filter(r => r.a !== "bg").map(r => { const ok = hexOk(t[r.a]) && hexOk(t[r.b]), c = ok ? contrast(t[r.a], t[r.b]) : 0, pass = c >= r.min; return `<tr><td>${r.l}</td><td>${c.toFixed(2)}</td><td>min ${r.min}</td><td><span class="pill ${pass ? "ok" : r.min >= 3 ? "err" : "warn"}" style="display:inline-block;width:62px">${pass ? "OK" : "Faible"}</span></td></tr>`; }).join("");
    const ts = $("#type-sample"); ts.style.cssText = `background:${t.bg};color:${t.text};border-color:${t.line}`;
    ts.innerHTML = `<div style="font-family:${fontStack(state.fonts.display.family).replace(/"/g, "'")};font-weight:${Math.max(...state.fonts.display.weights, 400)};font-size:34px;line-height:1.05;letter-spacing:-.01em">${esc(state.copy.title || state.brand.name)}</div><div style="font-family:${fontStack(state.fonts.body.family).replace(/"/g, "'")};color:${t.text2};margin-top:6px">${esc(state.copy.subtitle || "")} <span style="color:${t.accent};font-weight:600">${esc(state.copy.cta || state.copy.hint || "")}</span></div>`;
  }
}

/* ----- mise à jour globale ----- */
function ensureFonts() {
  const url = fontsURL(state.fonts); let l = $("#gf-preview");
  if (!l) { l = document.createElement("link"); l.id = "gf-preview"; l.rel = "stylesheet"; document.head.appendChild(l); }
  if (l.href !== url) l.href = url;
}
function runUpdate() {
  if (!state) return;
  COPY.forEach(c => { if (state.copy[c.k] == null) state.copy[c.k] = c.k === "ghost" ? (state.brand.name || "").toUpperCase() : c.d; });
  lastRes = resolveAssets(state);
  if (!manual) $("#prompt-out").value = buildPrompt(state, lastRes);
  runCheck(); refreshLive(); saveDraft(); ensureFonts(); schedulePreview();
}
const update = (now) => (now === true ? runUpdate() : update.d());
update.d = debounce(runUpdate, 140);
function runCheck() {
  const txt = $("#prompt-out").value; lastCheck = validatePrompt(txt, state);
  const extra = [];
  if (lastRes && lastRes.demoMasks && state.arch === "tryon") extra.push({ lvl: "warn", title: "Masques de démonstration", detail: "Les masques de l'annexe correspondent au mannequin de remplacement. Téléversez vos photos et vos masques à l'étape Assets pour obtenir les vôtres." });
  if (!state.brand.name.trim()) extra.push({ lvl: "err", title: "Nom de marque absent", detail: "Renseignez un nom fictif à l'étape Marque." });
  if (ARCH[state.arch].assets === "sprite") spriteChecks().filter(c => c[0] === "err" && !/Aucune URL/.test(c[1])).forEach(c => extra.push({ lvl: "err", title: "Feuille de sprites", detail: c[1] }));
  const issues = lastCheck.issues.concat(extra), ne = issues.filter(i => i.lvl === "err").length, nw = issues.length - ne;
  $("#sec-count").textContent = lastCheck.count + " / 15"; $("#sec-count").className = "badge " + (lastCheck.count === 15 ? "ok" : "err");
  $("#issue-count").textContent = issues.length; $("#issue-count").className = "badge " + (ne ? "err" : nw ? "warn" : "ok");
  $("#secmap").innerHTML = SECTIONS.map((n, i) => `<span class="${lastCheck.present[i] ? "on" : "miss"}" title="${i + 1}. ${n}">${i + 1}</span>`).join("");
  $("#prompt-size").textContent = txt.length.toLocaleString("fr-FR") + " caractères, " + txt.split("\n").length + " lignes";
  $("#check-summary").innerHTML = `<span>${lastCheck.count} / 15 sections</span><span>${ne} erreur(s)</span><span>${nw} avertissement(s)</span>`;
  $("#issues").innerHTML = issues.length ? issues.sort((a, b) => (a.lvl === "err" ? 0 : 1) - (b.lvl === "err" ? 0 : 1)).map(i => `<li><span class="pill ${i.lvl}">${i.lvl === "err" ? "Erreur" : "À voir"}</span><span><b>${esc(i.title)}</b><small>${esc(i.detail)}</small></span></li>`).join("") : `<li><span class="pill ok">OK</span><span><b>Rien à signaler</b><small>15 sections présentes, valeurs exactes, URL fournies, contrastes suffisants, textes tous listés.</small></span></li>`;
}
function saveDraft() {
  try {
    const s = JSON.parse(JSON.stringify(state, (k, v) => (k === "data" || k === "alpha" ? "" : v)));
    s.assets.masks = []; s.assets.variants = s.assets.variants.map(v => ({ url: v.url || "", data: "", name: "" })); s.assets.images = s.assets.images.map(v => ({ url: (v && v.url) || "", data: "", name: "" }));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
  } catch (e) { /* stockage indisponible : l'outil fonctionne sans */ }
}
function loadState(s) {
  state = fillDefaults(s); manual = false; $("#regen").hidden = true; Object.keys(cache).forEach(k => delete cache[k]);
  renderPanel(); runUpdate();
}

/* ----- aperçu ----- */
const VP = { land: [1440, 900], port: [390, 844] };
function fitStage() {
  const box = $("#stagebox"), stage = $("#stage");
  if (view.full) { stage.style.width = box.clientWidth + "px"; stage.style.height = box.clientHeight + "px"; stage.style.transform = "none"; $("#view-dims").textContent = box.clientWidth + " par " + box.clientHeight + " px, taille réelle"; return; }
  const [w, h] = VP[view.vp], k = box.clientWidth / w;
  stage.style.width = w + "px"; stage.style.height = h + "px"; stage.style.transform = "scale(" + k + ")";
  $("#view-dims").textContent = "Cadre " + w + " par " + h + " px, affiché à " + Math.round(k * 100) + " %";
}
function renderPreview() {
  if (view.tab !== "view") return;
  const box = $("#stagebox"); box.className = "stagebox " + view.vp + (view.full ? " full" : "");
  fitStage();
  if (destroyDemo) { destroyDemo(); destroyDemo = null; }
  const stage = $("#stage");
  if (view.src === "demo") {
    const C = demoConfig(state, lastRes); C.rm = C.inter.reduced && (view.rm || matchMedia("(prefers-reduced-motion: reduce)").matches);
    destroyDemo = mountDemo(stage, C);
    $("#view-note").textContent = lastRes.notes.join(" ");
  } else {
    stage.innerHTML = "";
    if (ai.html) { const f = document.createElement("iframe"); f.setAttribute("sandbox", "allow-scripts"); f.title = "Page générée par Claude"; f.srcdoc = instrument(ai.html); stage.appendChild(f); ai.ready = false; clearTimeout(ai.timer); ai.timer = setTimeout(() => { if (!ai.ready) aiStatus("Le cadre d'aperçu ne répond pas dans cette vue. Téléchargez la page .html et ouvrez la dans votre navigateur.", "warn"); }, 6000); }
    else stage.innerHTML = `<div style="display:grid;place-items:center;height:100%;font:600 28px var(--f-display);color:var(--ink2);text-align:center;padding:40px">Aucune page générée pour l'instant</div>`;
    $("#view-note").textContent = "";
  }
}
const schedulePreview = debounce(() => { if (view.tab === "view" && view.src === "demo") renderPreview(); }, 450);
function setTab(t) {
  view.tab = t;
  ["prompt", "check", "view"].forEach(x => { $("#tab-" + x).setAttribute("aria-selected", x === t); $("#pane-" + x).hidden = x !== t; });
  if (t === "view") renderPreview(); else if (destroyDemo) { destroyDemo(); destroyDemo = null; $("#stage").innerHTML = ""; }
}
function setSrc(s) { view.src = s; $("#src-demo").setAttribute("aria-pressed", s === "demo"); $("#src-ai").setAttribute("aria-pressed", s === "ai"); $("#gen-demo").hidden = s !== "demo"; $("#gen-ai").hidden = s !== "ai"; $("#vp-rm").hidden = s !== "demo"; renderPreview(); }

/* ----- page générée par Claude ----- */
function aiStatus(msg, lvl) { const el = $("#ai-status"); el.hidden = !msg; el.textContent = msg || ""; el.className = "note " + (lvl || ""); }
function assetMap() {
  const U = assetURLs(state), r = lastRes, map = [];
  const put = (from, to) => { if (from && to && from !== to && isData(to)) map.push([from, to]); };
  put(U.sprite, r.sprite); (r.photos || []).forEach((p, i) => put(U.variants[i], p)); (r.images || []).forEach((p, i) => put(U.images[i], p)); put(U.ar, r.room);
  return map.sort((a, b) => b[0].length - a[0].length);
}
function instrument(html) {
  let out = html; assetMap().forEach(([from, to]) => { out = out.split(from).join(to); });
  (lastRes.masks || []).forEach((m, i) => { out = out.split("asset://masque-" + (i + 1)).join(m); });
  const probeJs = `<script>(function(){var errs=[];addEventListener("error",function(e){errs.push(String(e.message||e.type));});addEventListener("unhandledrejection",function(e){errs.push(String(e.reason));});addEventListener("load",function(){setTimeout(function(){var d=document.documentElement;try{parent.postMessage({ams:"ready",errs:errs,text:(document.body.innerText||"").slice(0,20000),scroll:d.scrollHeight>innerHeight+2||d.scrollWidth>innerWidth+2},"*")}catch(e){}},1600)});})();<\/script>`;
  return /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, m => m + probeJs) : probeJs + out;
}
function extractHTML(txt) {
  const low = txt.toLowerCase(); let a = low.indexOf("<!doctype html"); if (a < 0) a = low.indexOf("<html");
  const b = low.lastIndexOf("</html>");
  if (a >= 0) return txt.slice(a, b > a ? b + 7 : undefined).trim();
  return txt.replace(/^\s*```[a-z]*\s*\n/i, "").replace(/\n```\s*$/, "").trim();
}
async function generate() {
  if (!sample || ai.busy) return;
  const prompt = $("#prompt-out").value; let body = prompt;
  (lastRes.masks || []).forEach((m, i) => { body = body.split(m).join("asset://masque-" + (i + 1)); });
  const input = "Tu es ingénieur front end. Écris la page décrite ci dessous dans un seul fichier HTML autonome : CSS et JavaScript en ligne, aucun framework, aucune dépendance hors la feuille Google Fonts indiquée. Les références de la forme assets/... et asset://... sont des URL valides, à utiliser telles quelles. Réponds uniquement avec le document HTML complet, de <!doctype html> à </html>, sans phrase avant ni après et sans bloc de code Markdown.\n\n" + body;
  ai.busy = true; ai.ctl = new AbortController(); $("#ai-go").disabled = true; $("#ai-stop").hidden = false; $("#ai-issues").innerHTML = "";
  const stream = $("#ai-stream"); stream.hidden = false; stream.textContent = ""; aiStatus("Claude réfléchit. Le premier texte arrive souvent après 5 à 60 secondes.");
  const same = prompt === ai.lastPrompt;
  try {
    const r = await sample(input, { signal: ai.ctl.signal, modelTier: $("#ai-tier").value, cache: same ? { gcTime: 1800000, refresh: true } : { gcTime: 1800000 }, onText: ({ text }) => { aiStatus("Claude écrit la page : " + text.length.toLocaleString("fr-FR") + " caractères."); stream.textContent = text.slice(-600); stream.scrollTop = stream.scrollHeight; } });
    ai.raw = r.text; ai.html = extractHTML(r.text); ai.lastPrompt = prompt;
    aiStatus(r.truncated ? "La réponse a été coupée avant la fin : la page est sans doute incomplète. Essayez le modèle Avancé ou décochez des interactions." : "Page générée, " + ai.html.length.toLocaleString("fr-FR") + " caractères. Contrôle en cours.", r.truncated ? "warn" : "ok");
    $("#dl-ai").hidden = $("#copy-ai").hidden = false; stream.hidden = true; renderPreview();
  } catch (e) {
    const msg = { cancelled: "Génération arrêtée.", not_granted: "Vous n'avez pas autorisé cet artefact à appeler Claude. Le prompt et le gabarit de démonstration restent disponibles.", rate_limited: e && e.reason === "usage_limit" ? "Votre limite d'utilisation de Claude est atteinte. Réessayez plus tard." : "Trop d'appels à la suite. Patientez un peu avant de relancer.", session_expired: "Session expirée : reconnectez vous à Claude puis relancez.", refused: "Claude a refusé cette demande. Modifiez le prompt puis relancez.", prompt_too_large: "Le prompt est trop long pour un appel. Réduisez le contenu ou les masques.", sampling_disabled: "Claude n'est pas disponible pour ce compte dans cette vue.", empty_completion: "Claude n'a rien écrit. Relancez, ou simplifiez le prompt." }[e && e.code] || "L'appel a échoué (" + ((e && e.code) || "erreur inconnue") + "). Vous pouvez relancer.";
    aiStatus(msg, e && e.code === "cancelled" ? "" : "err"); stream.hidden = true;
    if (e && ["not_granted", "sampling_disabled", "not_declared", "capability_disabled"].includes(e.code)) { $("#ai-go").hidden = true; }
  } finally { ai.busy = false; ai.ctl = null; $("#ai-go").disabled = false; $("#ai-stop").hidden = true; }
}
addEventListener("message", e => {
  const d = e.data; if (!d || d.ams !== "ready") return; const f = $("#stage iframe"); if (!f || e.source !== f.contentWindow) return;
  ai.ready = true; clearTimeout(ai.timer);
  const out = [], norm = s => s.toLowerCase().replace(/\s+/g, " ").trim();
  const listed = textList(state).map(x => norm(x[1])).sort((a, b) => b.length - a.length);
  (d.errs || []).slice(0, 5).forEach(x => out.push(["err", "Erreur dans la console", x]));
  if (d.scroll) out.push(["warn", "La page dépasse du cadre", "Une barre de défilement apparaît à cette taille, alors que le prompt l'interdit."]);
  const seen = new Set();
  String(d.text || "").split("\n").map(norm).filter(Boolean).forEach(line => { let rest = line; listed.forEach(t => { rest = rest.split(t).join(" "); }); rest = rest.replace(/[\d\s\/:.,;x€$%+()|-]/g, ""); if (rest.length > 1 && !seen.has(line)) { seen.add(line); out.push(["warn", "Texte non listé dans la page", "« " + line.slice(0, 90) + " »"]); } });
  if (!out.length) out.push(["ok", "Contrôle de la page passé", "Aucune erreur console, aucun défilement, aucun texte hors liste."]);
  $("#ai-issues").innerHTML = out.slice(0, 14).map(([l, t, s]) => `<li><span class="pill ${l}">${{ ok: "OK", warn: "À voir", err: "Erreur" }[l]}</span><span><b>${esc(t)}</b><small>${esc(s)}</small></span></li>`).join("");
  aiStatus("Page affichée. Les visuels sont ceux de l'aperçu ; le fichier téléchargé garde vos URL.", "ok");
});

/* ----- copie et téléchargement ----- */
async function copyText(txt, okMsg, field) {
  try { await navigator.clipboard.writeText(txt); toast(okMsg); }
  catch (e) { if (field) { field.focus(); field.select(); try { if (document.execCommand("copy")) return toast(okMsg); } catch (e2) { /* rien */ } toast("Copie refusée ici : le texte est sélectionné, utilisez Ctrl+C ou Cmd+C."); } else toast("Copie refusée dans cette vue."); }
}
async function saveFile(filename, data) {
  if (downloads) {
    try { await downloads.save({ filename, data }); toast("Fichier enregistré : " + filename); }
    catch (e) { toast({ declined: "Téléchargement annulé.", rate_limited: "Une demande est déjà ouverte. Réessayez dans un instant." }[e && e.code] || "Téléchargement indisponible dans cette vue. Utilisez Copier."); }
    return;
  }
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "text/plain;charset=utf-8" })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); toast("Téléchargement demandé : " + filename + ". Si rien ne se passe, utilisez Copier."); }
  catch (e) { toast("Téléchargement indisponible ici. Utilisez Copier."); }
}
const slug = () => (state.brand.name || "marque").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "marque";

/* ----- téléversements ----- */
const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => res({ data: r.result, name: f.name, w: im.naturalWidth, h: im.naturalHeight, img: im }); im.onerror = () => rej(new Error("image illisible")); im.src = r.result; }; r.onerror = rej; r.readAsDataURL(f); });
function analyzeSprite(img, cols, rows) {
  const q = 16, cv = document.createElement("canvas"); cv.width = cols * q; cv.height = rows * q; const c = cv.getContext("2d"); c.drawImage(img, 0, 0, cv.width, cv.height);
  const d = c.getImageData(0, 0, cv.width, cv.height).data, al = (x, y) => d[(y * cv.width + x) * 4 + 3]; let opaque = 0; const empty = [];
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) { if (al(cc * q, r * q) > 200) opaque++; let sum = 0; for (let y = 0; y < q; y++) for (let x = 0; x < q; x++) sum += al(cc * q + x, r * q + y); if (sum < q * q * 4) empty.push(cc + "," + r); }
  return { opaque, empty };
}
function maskFlat(img) { const cv = document.createElement("canvas"); cv.width = 32; cv.height = 48; const c = cv.getContext("2d"); c.drawImage(img, 0, 0, 32, 48); const d = c.getImageData(0, 0, 32, 48).data; let mn = 255, mx = 0; for (let i = 3; i < d.length; i += 4) { mn = Math.min(mn, d[i]); mx = Math.max(mx, d[i]); } return mx - mn < 40; }
function diffMask(base, vari, blurPx, srcW) {
  const W = 200, Hh = Math.round(W * base.naturalHeight / base.naturalWidth), get = im => { const cv = document.createElement("canvas"); cv.width = W; cv.height = Hh; const c = cv.getContext("2d"); c.drawImage(im, 0, 0, W, Hh); return c.getImageData(0, 0, W, Hh).data; };
  const A = get(base), B = get(vari); let m = new Float32Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) { const p = i * 4, df = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2]), Math.abs(A[p + 3] - B[p + 3])); m[i] = df > 14 ? 1 : 0; }
  const r = Math.max(1, Math.round(blurPx * W / srcW)), pass = (src, horiz) => { const out = new Float32Array(W * Hh); for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -r - 1; k <= r + 1; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= W || yy >= Hh) continue; s += src[yy * W + xx]; n++; } out[y * W + x] = s / n; } return out; };
  m = pass(pass(m, true), false); for (let i = 0; i < m.length; i++) m[i] = m[i] > 0.02 ? 1 : 0;   // dilatation
  m = pass(pass(m, true), false);                                                                    // flou
  const cv = document.createElement("canvas"); cv.width = W; cv.height = Hh; const c = cv.getContext("2d"), id = c.createImageData(W, Hh);
  for (let i = 0; i < m.length; i++) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = Math.round(Math.min(1, m[i]) * 255); }
  c.putImageData(id, 0, 0); return cv.toDataURL("image/png");
}
async function onUpload(kind, files) {
  const a = state.assets;
  try {
    const list = await Promise.all([...files].sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true })).map(readFile));
    if (!list.length) return;
    if (kind === "sprite") { const f = list[0]; Object.assign(a.sprite, { data: f.data, name: f.name, w: f.w, h: f.h, alpha: analyzeSprite(f.img, a.sprite.cols, a.sprite.rows) }); }
    if (kind === "variants") { a.variants = Array.from({ length: 9 }, (_, i) => list[i] ? { url: (a.variants[i] || {}).url || "", data: list[i].data, name: list[i].name, w: list[i].w, h: list[i].h, img: list[i].img } : (a.variants[i] || { url: "", data: "", name: "" })); a.vw = list[0].w; a.vh = list[0].h; if (list.length !== 9) toast(list.length + " photo(s) reçue(s), 9 attendues. Elles sont rangées par nom de fichier."); }
    if (kind === "masks") { a.masks = list.slice(0, 8).map(f => ({ data: f.data, name: f.name, flat: maskFlat(f.img) })); if (list.length !== 8) toast(list.length + " masque(s) reçu(s), 8 attendus."); }
    if (kind === "images") a.images = state.items.map((_, i) => list[i] ? { url: (a.images[i] || {}).url || "", data: list[i].data, name: list[i].name } : (a.images[i] || { url: "", data: "", name: "" })), a.iw = list[0].w, a.ih = list[0].h;
    if (kind === "ar") Object.assign(a.ar, { data: list[0].data, name: list[0].name });
    renderPanel(); runUpdate();
  } catch (e) { toast("Fichier illisible : choisissez une image PNG, WebP ou JPEG."); }
}

/* ----- événements ----- */
function onField(e, final) {
  const el = e.target;
  if (el.dataset.urls) { const rows = el.value.split("\n").map(s => s.trim()); const key = el.dataset.urls, n = key === "variants" ? 9 : state.items.length; state.assets[key] = Array.from({ length: n }, (_, i) => Object.assign({ data: "", name: "" }, state.assets[key][i] || {}, { url: rows[i] || "" })); return update(); }
  if (el.dataset.w) { const role = el.dataset.w, ws = $$(`input[data-w="${role}"]:checked`).map(x => +x.value); if (!ws.length) { el.checked = true; return; } state.fonts[role].weights = ws; return update(); }
  const p = el.dataset.p; if (!p) return;
  let v = el.type === "checkbox" ? el.checked : el.type === "number" || el.dataset.num ? Number(el.value) : el.value;
  if (el.type === "number" && (!isFinite(v) || el.value === "")) return;
  if (el.dataset.hex) { if (!/^#/.test(v)) v = "#" + v; if (!hexOk(v)) return; }
  if (typeof v === "string" && el.type !== "url" && el.type !== "color") v = v.replace(/[\u2012-\u2015]/g, "-");
  setP(state, p, v);
  if (p.startsWith("tokens.")) $$(`[data-p="${p}"]`).forEach(x => { if (x !== el) x.value = v; });
  if (p === "arch") { const A = ARCH[v]; if (v === "tryon") { state.inter.product = false; state.inter.swatches = false; } }
  if (p === "fonts.display.family" || p === "fonts.body.family") { const role = p.split(".")[1], av = FONTS[v].w; state.fonts[role].weights = role === "display" ? [av[av.length > 2 ? av.length - 2 : av.length - 1]] : av.filter(w => w <= 600).slice(0, 3); if (!state.fonts[role].weights.length) state.fonts[role].weights = [av[0]]; }
  if (p === "assets.sprite.url") state.assets.sprite.alpha = state.assets.sprite.data ? state.assets.sprite.alpha : null;
  if (final && el.dataset.rr) { renderPanel(); return runUpdate(); }
  update();
}
function onAct(btn) {
  const act = btn.dataset.act, i = +btn.dataset.i, j = +btn.dataset.j, sp = state.assets.sprite;
  if (act === "add-item") { const n = state.items.length; state.items.push({ name: "Pièce " + (n + 1), tag: "Collection", price: "50 €", desc: "Description courte.", shape: SHAPE_ORDER[n % 8], colors: [{ name: "Clair", hex: "#D9D4C8", col: Math.min(n, sp.cols - 1), row: 0 }] }); }
  if (act === "del-item") { if (state.items.length <= 2) return toast("Gardez au moins deux entrées."); state.items.splice(i, 1); }
  if (act === "add-color") { const it = state.items[i], last = it.colors[it.colors.length - 1] || { col: i, row: -1 }; it.colors.push({ name: "Coloris " + (it.colors.length + 1), hex: "#7A7F8A", col: last.col, row: Math.min(sp.rows - 1, last.row + 1) }); }
  if (act === "del-color") { if (state.items[i].colors.length <= 1) return toast("Gardez au moins un coloris."); state.items[i].colors.splice(j, 1); }
  if (act === "auto-cells") { state.items.forEach((it, c) => it.colors.forEach((col, r) => { col.col = c; col.row = r; })); sp.cols = state.items.length; sp.rows = Math.max(...state.items.map(it => it.colors.length)); if (!sp.data) { sp.w = sp.cols * 512; sp.h = sp.rows * 512; } toast("Grille recalculée : " + sp.cols + " colonnes par " + sp.rows + " lignes."); }
  if (act === "clear-sprite") Object.assign(sp, { data: "", name: "", alpha: null });
  if (act === "dark") { state.tokens = { bg: "#0C0C0E", text: "#EDEDE8", text2: "#9A9A93", line: "#2C2C30", ghost: "#18181B", accent: "#FF5A3C" }; toast("Palette sombre appliquée."); }
  if (act === "copy-flux") return copyText(fluxPrompt(), "Prompt Flux copié.");
  if (act === "gen-masks") {
    const v = state.assets.variants; if (v.length < 9 || !v.every(x => x.img)) return toast("Téléversez d'abord les 9 photos : le calcul compare leurs pixels.");
    state.assets.masks = v.slice(1).map((x, n) => ({ data: diffMask(v[0].img, x.img, state.assets.blur, state.assets.vw), name: "masque-" + (n + 1) + ".png", flat: false })); toast("8 masques calculés par différence avec la base, flou de " + state.assets.blur + " px.");
  }
  renderPanel(); runUpdate();
}
function goStep(n) { if (n > 5) { document.body.dataset.view = "out"; syncSwitch(); setTab("prompt"); $(".desk").scrollIntoView({ behavior: "smooth", block: "start" }); return; } state.step = Math.max(0, Math.min(5, n)); renderPanel(); saveDraft(); $("#panel").scrollIntoView({ block: "nearest" }); }
function syncSwitch() { const v = document.body.dataset.view; $("#vs-form").setAttribute("aria-selected", v === "form"); $("#vs-out").setAttribute("aria-selected", v === "out"); if (v === "out" && view.tab === "view") renderPreview(); }

function boot() {
  document.body.dataset.view = "form";
  const P = $("#panel");
  P.addEventListener("input", e => onField(e, false));
  P.addEventListener("change", e => { if (e.target.dataset.up) { onUpload(e.target.dataset.up, e.target.files); return; } onField(e, true); });
  P.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (b) onAct(b); });
  $("#steps").addEventListener("click", e => { const b = e.target.closest("[data-step]"); if (b) goStep(+b.dataset.step); });
  $("#prev").onclick = () => goStep(state.step - 1); $("#next").onclick = () => goStep(state.step + 1);
  $("#tpl-bunto").onclick = () => { loadState(TEMPLATES.bunto()); toast("Gabarit BUNTO chargé."); };
  $("#tpl-maison").onclick = () => { loadState(TEMPLATES.maison()); toast("Gabarit Maison Edit chargé."); };
  $("#tpl-blank").onclick = () => { loadState(TEMPLATES.blank()); toast("Projet vierge : remplacez les exemples par vos contenus."); };
  ["prompt", "check", "view"].forEach(t => { $("#tab-" + t).onclick = () => setTab(t); });
  $("#vs-form").onclick = () => { document.body.dataset.view = "form"; syncSwitch(); }; $("#vs-out").onclick = () => { document.body.dataset.view = "out"; syncSwitch(); };
  $("#prompt-out").addEventListener("input", () => { manual = true; $("#regen").hidden = false; runCheck(); });
  $("#regen").onclick = () => { manual = false; $("#regen").hidden = true; runUpdate(); toast("Prompt régénéré depuis le formulaire."); };
  $("#copy").onclick = () => copyText($("#prompt-out").value, "Prompt copié dans le presse papiers.", $("#prompt-out"));
  $("#dl-md").onclick = () => saveFile("prompt-" + slug() + "-" + state.arch + ".md", $("#prompt-out").value);
  $("#src-demo").onclick = () => setSrc("demo"); $("#src-ai").onclick = () => setSrc("ai");
  $("#vp-land").onclick = () => { view.vp = "land"; $("#vp-land").setAttribute("aria-pressed", true); $("#vp-port").setAttribute("aria-pressed", false); renderPreview(); };
  $("#vp-port").onclick = () => { view.vp = "port"; $("#vp-port").setAttribute("aria-pressed", true); $("#vp-land").setAttribute("aria-pressed", false); renderPreview(); };
  $("#vp-rm").onclick = () => { view.rm = !view.rm; $("#vp-rm").setAttribute("aria-pressed", view.rm); renderPreview(); };
  $("#vp-replay").onclick = () => renderPreview();
  $("#vp-full").onclick = () => { view.full = true; const b = document.createElement("button"); b.className = "btn closefull"; b.id = "closefull"; b.type = "button"; b.textContent = "Fermer l'aperçu agrandi"; b.onclick = () => { view.full = false; b.remove(); renderPreview(); }; document.body.appendChild(b); renderPreview(); b.focus(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && view.full) { const b = $("#closefull"); if (b) b.click(); } });
  $("#dl-demo").onclick = () => { const C = demoConfig(state, lastRes); saveFile("gabarit-" + slug() + "-" + state.arch + ".html", demoDoc(C)); };
  $("#ai-go").onclick = generate; $("#ai-stop").onclick = () => ai.ctl && ai.ctl.abort();
  $("#dl-ai").onclick = () => saveFile("page-" + slug() + "-" + state.arch + ".html", ai.html);
  $("#copy-ai").onclick = () => copyText(ai.html, "Code de la page copié.");
  new ResizeObserver(() => { if (view.tab === "view") fitStage(); }).observe($("#stagebox"));
  addEventListener("resize", () => { if (view.tab === "view") fitStage(); });

  let draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }
  if (draft && draft.arch && ARCH[draft.arch] && draft.assets && draft.tokens) { const b = baseState(); draft.assets = Object.assign(b.assets, draft.assets); draft.inter = Object.assign(b.inter, draft.inter); loadState(Object.assign(b, draft)); }
  else loadState(TEMPLATES.bunto());

  // Capacités de l'artefact : l'appel à Claude et l'enregistrement de fichiers s'allument s'ils sont offerts à cette vue.
  $("#ai-go").disabled = true; aiStatus("Recherche de l'accès à Claude dans cette vue.");
  const cl = window.claude && typeof window.claude.use === "function" ? window.claude : null;
  if (!cl) { aiStatus("Cette copie de la page n'a pas accès à Claude : collez le prompt dans l'IA de code de votre choix. Le gabarit de démonstration reste disponible.", "warn"); $("#ai-go").hidden = true; }
  else {
    cl.use("sample").then(s => { sample = s; if (s) { $("#ai-go").disabled = false; aiStatus(""); } else { $("#ai-go").hidden = true; aiStatus("L'appel à Claude n'est pas offert dans cette vue : collez le prompt dans l'IA de code de votre choix. Le gabarit de démonstration reste disponible.", "warn"); } });
    cl.use("downloads").then(d => { downloads = d; });
  }
}
boot();
