"use strict";
/* ---------- utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Règle maison : aucun tiret cadratin ni demi cadratin, ni dans l'interface ni dans les prompts.
const clean = s => String(s == null ? "" : s).replace(/\s*[\u2012\u2013\u2014\u2015]\s*/g, ", ");
const getP = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split("."); const l = ks.pop(); ks.reduce((a, k) => a[k], o)[l] = v; };
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const pct = n => (Math.round(n * 1000) / 1000) + "%";
const hexOk = h => /^#[0-9a-f]{6}$/i.test(h);
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const shade = (h, f) => "#" + hexRgb(h).map(v => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))).toString(16).padStart(2, "0")).join("");
const isData = u => /^data:/.test(u || "");
const fileName = u => { try { return decodeURIComponent(String(u).split(/[?#]/)[0].split("/").pop()) || "image.png"; } catch (e) { return "image.png"; } };

/* ---------- référentiels ---------- */
const REAL_BRANDS = ["nike", "adidas", "zara", "h&m", "gucci", "prada", "apple", "chanel", "dior", "uniqlo", "balenciaga", "louis vuitton", "hermes", "hermès", "supreme", "levi's", "levis", "puma", "reebok", "new balance", "asos", "shein", "burberry", "versace", "fendi", "celine", "céline", "lacoste", "ralph lauren", "tommy hilfiger", "calvin klein", "the north face", "patagonia", "samsung", "amazon", "ikea", "sephora", "mango", "arket", "carhartt", "stussy", "stüssy", "off white", "yeezy", "converse", "vans", "decathlon", "kiabi", "sandro", "maje", "jacquemus", "saint laurent", "ysl", "givenchy", "valentino", "armani", "moncler", "loewe", "bottega veneta", "miu miu", "tesla", "sony", "microsoft"];
const realBrandIn = txt => { const t = " " + String(txt).toLowerCase().replace(/-apple-system/g, " ").replace(/[^a-z0-9àâçéèêëîïôûùüÿñæœ&' ]/g, " ") + " "; return REAL_BRANDS.find(b => t.includes(" " + b + " ")) || null; };

const FONTS = {
  "Unbounded": { w: [300, 400, 500, 700, 900], fb: "Arial Black, system-ui, sans-serif" },
  "Archivo": { w: [400, 500, 600, 700, 900], fb: "Arial, system-ui, sans-serif" },
  "Anton": { w: [400], fb: "Impact, 'Arial Narrow', sans-serif" },
  "Bricolage Grotesque": { w: [400, 500, 600, 700, 800], fb: "'Arial Narrow', system-ui, sans-serif" },
  "Space Grotesk": { w: [400, 500, 600, 700], fb: "system-ui, sans-serif" },
  "Syne": { w: [400, 500, 600, 700, 800], fb: "system-ui, sans-serif" },
  "Inter Tight": { w: [400, 500, 600, 700], fb: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  "Inter": { w: [400, 500, 600, 700], fb: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  "Manrope": { w: [400, 500, 600, 700, 800], fb: "system-ui, sans-serif" },
  "DM Sans": { w: [400, 500, 600, 700], fb: "system-ui, sans-serif" },
  "Jost": { w: [300, 400, 500, 600, 700], fb: "'Century Gothic', system-ui, sans-serif" },
  "Outfit": { w: [300, 400, 500, 600, 700], fb: "system-ui, sans-serif" },
  "Work Sans": { w: [400, 500, 600, 700], fb: "system-ui, sans-serif" },
  "Cormorant Garamond": { w: [400, 500, 600, 700], fb: "Garamond, 'Times New Roman', serif" },
  "Playfair Display": { w: [400, 500, 600, 700, 900], fb: "Didot, Georgia, serif" },
  "Fraunces": { w: [400, 500, 600, 700, 900], fb: "Georgia, serif" },
  "Instrument Serif": { w: [400], fb: "Georgia, 'Times New Roman', serif" },
  "Bodoni Moda": { w: [400, 500, 600, 700, 900], fb: "Didot, 'Bodoni MT', serif" },
  "IBM Plex Mono": { w: [400, 500, 600, 700], fb: "ui-monospace, Menlo, Consolas, monospace" },
  "JetBrains Mono": { w: [400, 500, 700], fb: "ui-monospace, Menlo, Consolas, monospace" },
  "Space Mono": { w: [400, 700], fb: "ui-monospace, 'Courier New', monospace" },
  "VT323": { w: [400], fb: "'Courier New', monospace" }
};
const fontStack = f => `"${f}", ${(FONTS[f] || { fb: "system-ui, sans-serif" }).fb}`;
const fontsURL = fonts => {
  const fams = [fonts.display, fonts.body].filter((f, i, a) => f && f.family && a.findIndex(x => x.family === f.family) === i);
  const q = fams.map(f => {
    const all = [fonts.display, fonts.body].filter(x => x.family === f.family).flatMap(x => x.weights);
    const ws = [...new Set(all)].map(Number).filter(Boolean).sort((a, b) => a - b);
    return "family=" + f.family.replace(/ /g, "+") + (ws.length ? ":wght@" + ws.join(";") : "");
  });
  return "https://fonts.googleapis.com/css2?" + q.join("&") + "&display=swap";
};

const TOKENS = [
  { k: "bg", css: "--bg", l: "Fond", role: "fond de page et des surfaces" },
  { k: "text", css: "--text", l: "Texte", role: "texte principal, logo, titres" },
  { k: "text2", css: "--text-2", l: "Texte secondaire", role: "légendes, liens de navigation, descriptions" },
  { k: "line", css: "--line", l: "Filet", role: "filets et bordures de 1px" },
  { k: "ghost", css: "--ghost", l: "Fantôme", role: "mot géant en fond et surfaces discrètes, purement décoratif" },
  { k: "accent", css: "--accent", l: "Accent", role: "actions, badge du panier, sélection, anneau de focus" }
];
const CONTRAST_RULES = [
  { a: "text", b: "bg", min: 4.5, l: "Texte sur fond" },
  { a: "text2", b: "bg", min: 4.5, l: "Texte secondaire sur fond" },
  { a: "accent", b: "bg", min: 3, l: "Accent sur fond" },
  { a: "bg", b: "text", min: 4.5, l: "Fond sur texte (boutons pleins)" },
  { a: "line", b: "bg", min: 1.2, l: "Filet sur fond" },
  { a: "ghost", b: "bg", min: 1.05, l: "Fantôme sur fond" }
];

const INTER = [
  { k: "drag", l: "Drag et fling", d: "Glisser pour déplacer, lancer avec inertie amortie." },
  { k: "hover", l: "Survol", d: "Réaction légère sous le pointeur, sans effet au tactile." },
  { k: "product", l: "Vue produit", d: "Un clic ouvre la fiche de la pièce choisie." },
  { k: "cart", l: "Panier", d: "Bouton d'achat, compteur et vol de la pièce vers le panier." },
  { k: "swatches", l: "Pastilles de couleur", d: "Changement de coloris par ligne de la feuille de sprites." },
  { k: "search", l: "Recherche", d: "Champ qui filtre la liste à la frappe." },
  { k: "filters", l: "Filtres", d: "Puces de catégorie au dessus de la liste." },
  { k: "ar", l: "Mode AR", d: "Photo de fond derrière le sujet détouré." },
  { k: "reduced", l: "Reduced motion", d: "Version calme quand le système le demande." },
  { k: "mobile", l: "Mobile", d: "Variantes portrait et paysage décrites dans le prompt." }
];

const SHAPE_NAMES = { tee: "T-shirt", hoodie: "Sweat à capuche", pants: "Pantalon", jacket: "Veste", cap: "Casquette", bag: "Sac", shoe: "Chaussure", skirt: "Jupe" };
const SHAPE_ORDER = ["tee", "hoodie", "pants", "jacket", "cap", "bag", "shoe", "skirt"];

const ARCH = {
  ring: { l: "a", name: "Anneau rotatif de produits", ref: "type BUNTO", assets: "sprite", th: "ring", n: 5,
    desc: "Un seul angle pilote tout : les pièces tournent sur un anneau horizontal, un clic ouvre la vue produit.",
    uses: ["drag", "hover", "product", "cart", "swatches", "reduced", "mobile"],
    K: { TILT: 7, OMEGA: 0.22, DAMP: 0.92, SMOOTH: 0.2, CLICK: 6, OPEN: 620, CLOSE: 480, FLY: 700, HOVER: 0.06, STEP: 420,
      L: { FW: 1440, FH: 900, CX: 720, CY: 450, R: 480, DROP: -130, S0: 280, PX: 400, PY: 450, S1: 470, SPREAD: 620 },
      P: { FW: 390, FH: 844, CX: 195, CY: 330, R: 128, DROP: -44, S0: 150, PX: 195, PY: 250, S1: 250, SPREAD: 300 } } },
  tryon: { l: "b", name: "Essayage par compositeur canvas à masques", ref: "type Maison Edit", assets: "variants", th: "tryon", n: 5,
    desc: "Trois colonnes : boutique, mannequin, récapitulatif. Les pièces se mélangent dans un canvas grâce à des masques doux.",
    uses: ["drag", "hover", "cart", "search", "filters", "ar", "reduced", "mobile"],
    K: { WIPE: 720, ROTMAX: 34, ROTSENS: 0.35, ROTDAMP: 0.88, STY_STEP: 900, STY_PAUSE: 2600, SCORE_BASE: 20, SCORE_BONUS: 8, COUNT: 600 } },
  stack: { l: "c", name: "Carrousel de cartes empilées", ref: "pile", assets: "sprite", th: "stack", n: 3,
    desc: "Les cartes forment une pile décalée ; celle de devant s'envole et repasse derrière.",
    uses: ["drag", "hover", "cart", "swatches", "reduced", "mobile"],
    K: { DX: 34, DY: -16, ROT: 3, SC: 0.06, FADE: 0.2, VIS: 4, MOVE: 520, OUT: 420, AUTO: 3200, FLYX: 620, FLYROT: 14, DRAGROT: 0.04, THRESH: 110, CW: 340, CH: 470 } },
  rail: { l: "d", name: "Étagère ou rail de produits qui défile", ref: "rail", assets: "sprite", th: "rail", n: 2,
    desc: "Une rangée infinie glisse sur un filet ; la pièce au centre grossit, le pointeur ralentit le rail.",
    uses: ["drag", "hover", "cart", "reduced", "mobile"],
    K: { GAP: 300, SPEED: 60, CELL: 220, BOB: 6, BOBF: 1.2, PHASE: 0.9, ZOOM: 0.18, FOCUS: 360, DAMP: 0.92, LIFT: 14, Y: 450, SLOW: 0.9 } },
  vhs: { l: "e", name: "Portfolio sombre avec effet VHS ou archive", ref: "archive", assets: "images", th: "vhs", n: 4,
    desc: "Une liste de projets à gauche, un écran à droite : lignes de balayage, décalage RVB, compteur d'images.",
    uses: ["hover", "filters", "reduced", "mobile"],
    K: { GLITCH: 240, BANDS: 6, SHIFT: 24, FPS: 25, NOISE: 12, TRACK: 2600, JIT: 140, SPLIT: 3 } },
  lookbook: { l: "f", name: "Lookbook plein écran avec transitions", ref: "lookbook", assets: "images", th: "look", n: 3,
    desc: "Des images plein cadre se succèdent par volet ; le titre monte lettre par lettre.",
    uses: ["drag", "hover", "reduced", "mobile"],
    K: { WIPE: 900, AUTO: 5200, STAG: 28, LET: 700, SWIPE: 60, PUSH: 8, ZOOM: 1.06 } },
  boutique: { l: "g", name: "Boutique virtuelle en 3 colonnes", ref: "boutique", assets: "sprite", th: "shop", n: 4,
    desc: "Catalogue à gauche, pièce en vedette au centre qui flotte et s'incline, panier à droite.",
    uses: ["hover", "product", "cart", "swatches", "search", "filters", "reduced", "mobile"],
    K: { FLOAT: 8, FLOATF: 0.8, TILTY: 14, TILTX: 10, DAMP: 0.9, OUT: 220, IN: 380, COUNT: 400, FLIP: 320 } }
};
const ARCH_ORDER = ["ring", "tryon", "stack", "rail", "vhs", "lookbook", "boutique"];

const COPY = [
  { k: "nav1", l: "Lien de navigation 1", d: "Collection" },
  { k: "nav2", l: "Lien de navigation 2", d: "Lookbook" },
  { k: "nav3", l: "Lien de navigation 3", d: "Journal" },
  { k: "cart", l: "Libellé du panier", d: "Panier", on: s => s.inter.cart },
  { k: "ghost", l: "Mot fantôme en fond", d: "", on: s => ["ring", "rail", "stack"].includes(s.arch) },
  { k: "title", l: "Titre principal", d: "Nouvelle saison" },
  { k: "subtitle", l: "Sous titre", d: "Six pièces, une seule ligne." },
  { k: "cta", l: "Bouton d'achat", d: "Ajouter au panier", on: s => s.inter.cart },
  { k: "back", l: "Bouton de retour", d: "Retour", on: s => s.inter.product && s.arch === "ring" },
  { k: "hint", l: "Indice d'interaction", d: "Glisser pour tourner" },
  { k: "footer", l: "Note de pied de page", d: "Livraison offerte dès 120 €" },
  { k: "search", l: "Texte indicatif de la recherche", d: "Rechercher", on: s => s.inter.search },
  { k: "filterAll", l: "Filtre par défaut", d: "Tout", on: s => s.inter.filters },
  { k: "shopTitle", l: "Titre de la colonne boutique", d: "La boutique", on: s => ["tryon", "boutique"].includes(s.arch) },
  { k: "recapTitle", l: "Titre du récapitulatif", d: "Votre sélection", on: s => ["tryon", "boutique"].includes(s.arch) },
  { k: "total", l: "Libellé du total", d: "Total", on: s => ["tryon", "boutique"].includes(s.arch) },
  { k: "empty", l: "Panier vide", d: "Aucune pièce pour l'instant", on: s => s.arch === "boutique" && s.inter.cart },
  { k: "score", l: "Libellé du score", d: "Score de style", on: s => s.arch === "tryon" },
  { k: "ar", l: "Bouton du mode AR", d: "Mode AR", on: s => s.inter.ar && s.arch === "tryon" },
  { k: "stylist", l: "Bouton du styliste", d: "Styliste IA", on: s => s.arch === "tryon" },
  { k: "reset", l: "Bouton de remise à zéro", d: "Tenue de base", on: s => s.arch === "tryon" },
  { k: "rec", l: "Étiquette d'enregistrement", d: "REC", on: s => s.arch === "vhs" }
];
const eff = s => { const o = {}; INTER.forEach(i => { o[i.k] = !!s.inter[i.k] && ARCH[s.arch].uses.includes(i.k); }); return o; };
const copyFields = s => { const v = Object.assign({}, s, { inter: eff(s) }); return COPY.filter(c => !c.on || c.on(v)); };

/* ---------- gabarits ---------- */
const mkColors = (list, col, row0 = 0) => list.map((c, j) => ({ name: c[0], hex: c[1], col, row: row0 + j }));
function baseState() {
  return {
    step: 0, arch: "ring",
    brand: { name: "", sector: "", tone: "", audience: "" },
    assets: {
      sprite: { url: "", data: "", name: "", cols: 5, rows: 4, w: 2560, h: 2048, loaded: "", alpha: null },
      variants: [], masks: [], vw: 1200, vh: 1800, head: 6, feet: 96, blur: 6,
      images: [], iw: 1920, ih: 1200, ar: { url: "", data: "", name: "" }
    },
    tokens: { bg: "#F2F2EF", text: "#141414", text2: "#5C5C58", line: "#CFCFC9", ghost: "#E4E4DF", accent: "#C7361A" },
    fonts: { display: { family: "Space Grotesk", weights: [500, 700] }, body: { family: "Inter", weights: [400, 500] } },
    inter: { drag: true, hover: true, product: true, cart: true, swatches: true, search: false, filters: false, ar: false, reduced: true, mobile: true },
    copy: {}, meta: { title: "", desc: "" },
    items: [],
    tryon: defaultTryon()
  };
}
function defaultTryon() {
  return {
    slots: [
      { id: "shoes", label: "Chaussures", opts: [{ name: "Ballerines Nuit", price: "120 €", hex: "#23262E", pts: 8 }, { name: "Bottes Cavalière", price: "260 €", hex: "#5A3A28", pts: 16 }, { name: "Baskets Craie", price: "150 €", hex: "#E9E4D8", pts: 11 }] },
      { id: "skirt", label: "Jupe", opts: [{ name: "Jupe Trapèze", price: "140 €", hex: "#2F3B52", pts: 9 }, { name: "Jupe Longue Plissée", price: "210 €", hex: "#8A2F3B", pts: 17 }, { name: "Jupe Crayon", price: "165 €", hex: "#C9B48F", pts: 12 }] },
      { id: "top", label: "Haut", opts: [{ name: "Tee Blanc Cassé", price: "60 €", hex: "#ECE7DD", pts: 7 }, { name: "Pull Col Rond", price: "180 €", hex: "#4D5B46", pts: 15 }, { name: "Débardeur Soie", price: "95 €", hex: "#B9788A", pts: 12 }] },
      { id: "bag", label: "Sac", opts: [{ name: "Mini Sac Boîte", price: "230 €", hex: "#7A5134", pts: 10 }, { name: "Cabas Atelier", price: "310 €", hex: "#1F1F1F", pts: 14 }, { name: "Pochette Soir", price: "145 €", hex: "#B08D3C", pts: 13 }] }
    ],
    looks: [
      { name: "Galerie le samedi", pick: [1, 1, 1, 1] },
      { name: "Dîner en terrasse", pick: [0, 2, 2, 2] },
      { name: "Matin pressé", pick: [2, 0, 1, 0] }
    ]
  };
}
const TEMPLATES = {
  bunto() {
    const s = baseState();
    s.arch = "ring";
    s.brand = { name: "BUNTO", sector: "Prêt à porter streetwear", tone: "Direct, graphique, un peu joueur", audience: "Citadins de 18 à 30 ans" };
    s.assets.sprite = { url: "https://cdn.bunto.example/sprites/bunto-sheet-2560x2048.png", data: "", name: "", cols: 5, rows: 4, w: 2560, h: 2048, loaded: "", alpha: null };
    s.tokens = { bg: "#EDEDEA", text: "#101010", text2: "#595955", line: "#CBCBC5", ghost: "#DFDFDA", accent: "#C8330F" };
    s.fonts = { display: { family: "Unbounded", weights: [500, 700] }, body: { family: "Inter Tight", weights: [400, 500, 600] } };
    s.inter = { drag: true, hover: true, product: true, cart: true, swatches: true, search: false, filters: false, ar: false, reduced: true, mobile: true };
    const tri = (a, b, c) => [a, b, c];
    s.items = [
      { name: "Tee Bloc", tag: "Hauts", price: "45 €", desc: "Jersey lourd 240 g, coupe droite, col côtelé serré.", shape: "tee", colors: mkColors([["Craie", "#E7E1D2"], ["Encre", "#1C1F26"], ["Tomate", "#D4442A"]], 0) },
      { name: "Hoodie Dôme", tag: "Hauts", price: "95 €", desc: "Molleton brossé, capuche doublée, poche kangourou.", shape: "hoodie", colors: mkColors([["Mousse", "#5E6B4A"], ["Encre", "#1C1F26"], ["Lilas", "#A79BC8"]], 1) },
      { name: "Cargo Pli", tag: "Bas", price: "110 €", desc: "Sergé de coton, pli marqué, deux poches à soufflet.", shape: "pants", colors: mkColors([["Sable", "#C9B58E"], ["Encre", "#1C1F26"], ["Olive", "#6B6A3C"]], 2) },
      { name: "Veste Atelier", tag: "Vestes", price: "160 €", desc: "Toile épaisse, boutons pression, col chemise.", shape: "jacket", colors: mkColors([["Cobalt", "#2B4BB8"], ["Écru", "#E4DCC8"], ["Rouille", "#A8502A"]], 3) },
      { name: "Cap Six", tag: "Accessoires", price: "35 €", desc: "Six panneaux, visière courbe, réglage par boucle.", shape: "cap", colors: mkColors([["Tomate", "#D4442A"], ["Encre", "#1C1F26"], ["Craie", "#E7E1D2"]], 4) },
      { name: "Sac Nomade", tag: "Accessoires", price: "70 €", desc: "Nylon recyclé, anse large, fond renforcé.", shape: "bag", colors: [{ name: "Encre", hex: "#1C1F26", col: 0, row: 3 }, { name: "Mousse", hex: "#5E6B4A", col: 1, row: 3 }, { name: "Tomate", hex: "#D4442A", col: 2, row: 3 }] }
    ];
    s.copy = { nav1: "Collection", nav2: "Lookbook", nav3: "Journal", cart: "Panier", ghost: "BUNTO", title: "Saison 04", subtitle: "Six pièces qui tournent rond.", cta: "Ajouter au panier", back: "Retour à l'anneau", hint: "Glisser pour tourner, cliquer pour ouvrir", footer: "Livraison offerte dès 120 €" };
    s.meta = { title: "BUNTO | Saison 04", desc: "BUNTO, six pièces streetwear à faire tourner et à adopter." };
    return s;
  },
  maison() {
    const s = baseState();
    s.arch = "tryon";
    s.brand = { name: "Maison Edit", sector: "Mode féminine, vestiaire capsule", tone: "Calme, précis, éditorial", audience: "Femmes de 28 à 45 ans" };
    const base = "https://cdn.maison-edit.example/tryon/";
    const names = ["base", "chaussures-1", "chaussures-2", "jupe-1", "jupe-2", "haut-1", "haut-2", "sac-1", "sac-2"];
    s.assets.variants = names.map(n => ({ url: base + n + "-1200x1800.png", data: "", name: "" }));
    s.assets.masks = [];
    s.assets.vw = 1200; s.assets.vh = 1800; s.assets.head = 6; s.assets.feet = 95;
    s.assets.ar = { url: base + "salon-1600x1200.jpg", data: "", name: "" };
    s.tokens = { bg: "#F3F0EA", text: "#1B1917", text2: "#635D55", line: "#D6CFC4", ghost: "#E8E3DA", accent: "#8A2F3B" };
    s.fonts = { display: { family: "Cormorant Garamond", weights: [500, 600] }, body: { family: "Jost", weights: [400, 500] } };
    s.inter = { drag: true, hover: true, product: false, cart: true, swatches: false, search: true, filters: true, ar: true, reduced: true, mobile: true };
    s.copy = { nav1: "Vestiaire", nav2: "Essayage", nav3: "Carnet", cart: "Panier", title: "Le salon d'essayage", subtitle: "Composez la tenue, pièce par pièce.", cta: "Ajouter la tenue", hint: "Glisser le mannequin pour le faire pivoter", footer: "Retours gratuits sous 30 jours", search: "Rechercher une pièce", filterAll: "Tout", shopTitle: "Le vestiaire", recapTitle: "Votre tenue", total: "Total", score: "Score de style", ar: "Mode AR", stylist: "Styliste IA", reset: "Tenue de base" };
    s.meta = { title: "Maison Edit | Le salon d'essayage", desc: "Maison Edit, un salon d'essayage virtuel pour composer sa tenue pièce par pièce." };
    return s;
  },
  blank() {
    const s = baseState();
    s.brand = { name: "Orbe Nord", sector: "Accessoires de ville", tone: "Sobre et chaleureux", audience: "Actifs de 25 à 40 ans" };
    s.items = [0, 1, 2, 3, 4].map(i => ({ name: "Pièce " + (i + 1), tag: "Collection", price: (40 + i * 15) + " €", desc: "Description courte de la pièce " + (i + 1) + ".", shape: SHAPE_ORDER[i], colors: mkColors([["Clair", "#DDD8CC"], ["Sombre", "#23252B"]], i) }));
    s.assets.sprite.cols = 5; s.assets.sprite.rows = 2; s.assets.sprite.w = 2560; s.assets.sprite.h = 1024;
    return s;
  }
};
function fillDefaults(s) {
  COPY.forEach(c => { if (s.copy[c.k] == null) s.copy[c.k] = c.k === "ghost" ? (s.brand.name || "").toUpperCase() : c.d; });
  if (!s.items.length) s.items = TEMPLATES.bunto().items;
  if (!s.meta.title) s.meta.title = (s.brand.name || "Marque") + " | " + (s.copy.title || "");
  if (!s.meta.desc) s.meta.desc = (s.brand.name || "Marque") + ", " + (s.brand.sector || "collection").toLowerCase() + ".";
  if (!s.tryon) s.tryon = defaultTryon();
  return s;
}

/* ---------- visuels de remplacement, dessinés au canvas ---------- */
const SHAPES = {
  tee: c => { c.moveTo(30, 18); c.quadraticCurveTo(50, 30, 70, 18); c.lineTo(94, 34); c.lineTo(84, 52); c.lineTo(72, 46); c.lineTo(72, 88); c.lineTo(28, 88); c.lineTo(28, 46); c.lineTo(16, 52); c.lineTo(6, 34); c.closePath(); },
  hoodie: c => { c.moveTo(34, 22); c.quadraticCurveTo(50, 2, 66, 22); c.lineTo(92, 40); c.lineTo(86, 84); c.lineTo(74, 84); c.lineTo(74, 90); c.lineTo(26, 90); c.lineTo(26, 84); c.lineTo(14, 84); c.lineTo(8, 40); c.closePath(); },
  pants: c => { c.moveTo(28, 8); c.lineTo(72, 8); c.lineTo(80, 94); c.lineTo(56, 94); c.lineTo(50, 36); c.lineTo(44, 94); c.lineTo(20, 94); c.closePath(); },
  jacket: c => { c.moveTo(34, 12); c.lineTo(50, 24); c.lineTo(66, 12); c.lineTo(92, 30); c.lineTo(88, 86); c.lineTo(74, 86); c.lineTo(73, 92); c.lineTo(27, 92); c.lineTo(26, 86); c.lineTo(12, 86); c.lineTo(8, 30); c.closePath(); },
  cap: c => { c.moveTo(14, 64); c.quadraticCurveTo(12, 26, 50, 26); c.quadraticCurveTo(80, 26, 82, 58); c.quadraticCurveTo(99, 60, 96, 72); c.quadraticCurveTo(70, 62, 14, 64); c.closePath(); },
  shoe: c => { c.moveTo(8, 50); c.quadraticCurveTo(22, 46, 30, 34); c.lineTo(48, 34); c.quadraticCurveTo(60, 54, 88, 58); c.quadraticCurveTo(97, 62, 94, 76); c.lineTo(8, 76); c.closePath(); },
  bag: c => { c.moveTo(20, 42); c.lineTo(80, 42); c.lineTo(88, 90); c.lineTo(12, 90); c.closePath(); c.moveTo(32, 42); c.quadraticCurveTo(50, 2, 68, 42); c.lineTo(61, 42); c.quadraticCurveTo(50, 14, 39, 42); c.closePath(); },
  skirt: c => { c.moveTo(34, 16); c.lineTo(66, 16); c.lineTo(88, 84); c.quadraticCurveTo(50, 94, 12, 84); c.closePath(); }
};
function drawShape(ctx, shape, hex, x, y, size) {
  const t = document.createElement("canvas"); t.width = t.height = size; const c = t.getContext("2d");
  c.scale(size / 100, size / 100);
  c.beginPath(); (SHAPES[shape] || SHAPES.tee)(c); c.fillStyle = hex; c.fill();
  c.globalCompositeOperation = "source-atop";
  const g = c.createLinearGradient(10, 0, 90, 100); g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.26)");
  c.fillStyle = g; c.fillRect(0, 0, 100, 100);
  c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 1.1; c.beginPath();
  if (shape === "pants") { c.moveTo(28, 16); c.lineTo(72, 16); }
  else if (shape === "cap") { c.moveTo(18, 58); c.quadraticCurveTo(50, 50, 82, 58); c.moveTo(50, 26); c.lineTo(50, 54); }
  else if (shape === "shoe") { c.moveTo(8, 68); c.lineTo(94, 68); c.moveTo(34, 40); c.lineTo(46, 46); c.moveTo(38, 36); c.lineTo(50, 42); }
  else if (shape === "bag") { c.moveTo(16, 56); c.lineTo(84, 56); }
  else if (shape === "skirt") { c.moveTo(34, 24); c.lineTo(66, 24); c.moveTo(42, 24); c.lineTo(32, 88); c.moveTo(58, 24); c.lineTo(68, 88); }
  else { c.moveTo(50, shape === "tee" ? 26 : 24); c.lineTo(50, 90); if (shape === "hoodie") { c.moveTo(34, 62); c.lineTo(66, 62); } }
  c.stroke();
  ctx.drawImage(t, x, y);
}
function makeSprite(items, cols, rows, cell = 256) {
  const cv = document.createElement("canvas"); cv.width = cols * cell; cv.height = rows * cell; const ctx = cv.getContext("2d");
  items.forEach((it, i) => (it.colors || []).forEach(c => {
    if (c.col < cols && c.row < rows) drawShape(ctx, it.shape || SHAPE_ORDER[i % 8], hexOk(c.hex) ? c.hex : "#888888", c.col * cell, c.row * cell, cell);
  }));
  return cv.toDataURL("image/png");
}
function makePhoto(i, item, tokens, w = 960, h = 600) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d");
  const col = (item.colors && item.colors[0] && hexOk(item.colors[0].hex)) ? item.colors[0].hex : "#777777";
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, shade(col, -0.55)); g.addColorStop(1, shade(col, 0.15)); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = shade(col, -0.7); c.globalAlpha = .5; c.beginPath(); c.ellipse(w * (.3 + .1 * (i % 3)), h * .95, w * .42, h * .2, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  const s = h * .78; drawShape(c, item.shape || SHAPE_ORDER[i % 8], shade(col, 0.35), w * (.5 + .08 * ((i % 3) - 1)) - s / 2, h * .1, s);
  const id = c.getImageData(0, 0, w, h), d = id.data; let seed = 7 + i * 131;
  for (let p = 0; p < d.length; p += 4) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; const n = ((seed >> 16) % 23) - 11; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
  c.putImageData(id, 0, 0);
  return cv.toDataURL("image/jpeg", .82);
}
function makeRoom(w = 800, h = 600) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d");
  let g = c.createLinearGradient(0, 0, 0, h * .7); g.addColorStop(0, "#cfc6b8"); g.addColorStop(1, "#e2dbcf"); c.fillStyle = g; c.fillRect(0, 0, w, h * .7);
  g = c.createLinearGradient(0, h * .7, 0, h); g.addColorStop(0, "#9b8468"); g.addColorStop(1, "#6f5b45"); c.fillStyle = g; c.fillRect(0, h * .7, w, h * .3);
  c.fillStyle = "#f4efe4"; c.fillRect(w * .08, h * .1, w * .2, h * .42); c.fillStyle = "#bcd0dc"; c.fillRect(w * .095, h * .12, w * .17, h * .38);
  c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.moveTo(w * .1, h * .7); c.lineTo(w * .27, h * .7); c.lineTo(w * .55, h); c.lineTo(w * .2, h); c.fill();
  c.fillStyle = "#5d6a52"; c.beginPath(); c.ellipse(w * .86, h * .5, w * .07, h * .16, 0, 0, 7); c.fill(); c.fillStyle = "#8a6a4c"; c.fillRect(w * .83, h * .62, w * .06, h * .1);
  c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(0, h * .69, w, 3);
  return cv.toDataURL("image/jpeg", .85);
}
/* Mannequin de remplacement : 9 photos alignées et 8 masques doux, même cadrage au pixel près. */
const FIG = {
  top: [
    c => { c.moveTo(150, 110); c.lineTo(250, 110); c.lineTo(292, 150); c.lineTo(274, 190); c.lineTo(252, 172); c.lineTo(250, 256); c.lineTo(150, 256); c.lineTo(148, 172); c.lineTo(126, 190); c.lineTo(108, 150); c.closePath(); },
    c => { c.moveTo(148, 108); c.lineTo(252, 108); c.lineTo(296, 150); c.lineTo(312, 300); c.lineTo(282, 304); c.lineTo(258, 190); c.lineTo(256, 272); c.lineTo(144, 272); c.lineTo(142, 190); c.lineTo(118, 304); c.lineTo(88, 300); c.lineTo(104, 150); c.closePath(); },
    c => { c.moveTo(166, 108); c.lineTo(180, 108); c.quadraticCurveTo(200, 138, 220, 108); c.lineTo(234, 108); c.lineTo(250, 172); c.lineTo(248, 256); c.lineTo(152, 256); c.lineTo(150, 172); c.closePath(); }
  ],
  skirt: [
    c => { c.moveTo(152, 250); c.lineTo(248, 250); c.lineTo(276, 366); c.lineTo(124, 366); c.closePath(); },
    c => { c.moveTo(152, 250); c.lineTo(248, 250); c.lineTo(286, 476); c.quadraticCurveTo(200, 494, 114, 476); c.closePath(); },
    c => { c.moveTo(152, 250); c.lineTo(248, 250); c.lineTo(252, 412); c.lineTo(148, 412); c.closePath(); }
  ],
  shoes: [
    c => { c.moveTo(202, 556); c.ellipse(176, 556, 26, 11, 0, 0, 6.3); c.moveTo(252, 556); c.ellipse(226, 556, 26, 11, 0, 0, 6.3); },
    c => { c.rect(159, 470, 36, 86); c.rect(207, 470, 36, 86); c.moveTo(202, 558); c.ellipse(174, 558, 28, 12, 0, 0, 6.3); c.moveTo(256, 558); c.ellipse(228, 558, 28, 12, 0, 0, 6.3); },
    c => { c.roundRect(146, 532, 58, 36, 13); c.roundRect(198, 532, 58, 36, 13); }
  ],
  bag: [
    c => { c.rect(288, 308, 44, 40); c.rect(304, 290, 12, 20); },
    c => { c.rect(278, 302, 72, 82); c.rect(294, 264, 8, 40); c.rect(326, 264, 8, 40); },
    c => { c.roundRect(64, 300, 54, 30, 6); }
  ]
};
const SLOT_IDS = ["shoes", "skirt", "top", "bag"];
function drawFigure(ctx, k, pick, colors) {
  ctx.save(); ctx.scale(k, k); ctx.lineCap = "round";
  const skin = "#d8b396", piece = (slot, i) => { const v = pick[i]; ctx.beginPath(); FIG[slot][v](ctx); ctx.fillStyle = colors[i][v]; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.16)"; ctx.lineWidth = 1; ctx.stroke(); };
  ctx.strokeStyle = skin; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(178, 256); ctx.lineTo(176, 546); ctx.moveTo(222, 256); ctx.lineTo(226, 546); ctx.stroke();
  piece("shoes", 0);
  if (pick[0] === 2) { ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillRect(148, 558, 54, 7); ctx.fillRect(200, 558, 54, 7); }
  piece("skirt", 1);
  ctx.strokeStyle = skin; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(124, 152); ctx.lineTo(104, 298); ctx.moveTo(276, 152); ctx.lineTo(296, 298); ctx.stroke();
  piece("top", 2);
  piece("bag", 3);
  ctx.fillStyle = skin; ctx.fillRect(190, 88, 20, 26); ctx.beginPath(); ctx.arc(200, 64, 30, 0, 7); ctx.fill();
  ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.arc(200, 58, 32, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(200, 44, 168, 60); ctx.fill(); ctx.beginPath(); ctx.arc(200, 22, 13, 0, 7); ctx.fill();
  ctx.restore();
}
function makeTryon(tryon) {
  const W = 600, H = 900, k = 1.5, MW = 120, MH = 180;
  const colors = tryon.slots.map(s => s.opts.map(o => hexOk(o.hex) ? o.hex : "#888888"));
  const photo = pick => { const cv = document.createElement("canvas"); cv.width = W; cv.height = H; drawFigure(cv.getContext("2d"), k, pick, colors); return cv.toDataURL("image/png"); };
  const photos = [photo([0, 0, 0, 0])], masks = [];
  SLOT_IDS.forEach((slot, si) => [1, 2].forEach(v => {
    const p = [0, 0, 0, 0]; p[si] = v; photos.push(photo(p));
    const cv = document.createElement("canvas"); cv.width = MW; cv.height = MH; const c = cv.getContext("2d");
    c.shadowColor = "#fff"; c.shadowBlur = 1.6; c.shadowOffsetX = 5000; c.translate(-5000, 0); c.scale(MW / 400, MW / 400);
    c.fillStyle = c.strokeStyle = "#fff"; c.lineWidth = 16; c.lineJoin = "round";
    [0, v].forEach(q => { c.beginPath(); FIG[slot][q](c); c.fill(); c.stroke(); });
    masks.push(cv.toDataURL("image/png"));
  }));
  return { photos, masks, w: W, h: H };
}
