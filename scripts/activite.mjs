// Statistiques d'activité du profil GitHub, dépôts privés compris.
//
// Lancé chaque jour par .github/workflows/activite.yml avec un jeton en lecture seule (ACTIVITE_TOKEN).
// Produit deux graphiques (contributions par mois, langages), chacun en version claire et sombre,
// et réécrit la partie du README comprise entre les marqueurs ACTIVITE:DEBUT et ACTIVITE:FIN.
// Les dépôts privés absents de PROJETS sont comptés sans être nommés.
//
// En local : GH_TOKEN=$(gh auth token) node scripts/activite.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const UTILISATEUR = 'fmenguy';
const TOKEN = process.env.GH_TOKEN;
const API = 'https://api.github.com';

// Projets montrés par leur nom, avec le lien à donner (le dépôt s'il est public, le site sinon)
const PROJETS = [
  { depot: 'strates-fmenguy', nom: 'Strates', lien: 'https://strates.fmenguy.fr/' },
  { depot: 'jeux-fmenguy', nom: 'Arcade FM', lien: 'https://github.com/fmenguy/jeux-fmenguy' },
  { depot: 'bathyreve', nom: 'Bathyrêve', lien: 'https://bathyreve.fmenguy.fr/' },
  { depot: 'fmenguy-site', nom: 'fmenguy.fr', lien: 'https://fmenguy.fr/' },
  { depot: 'histoire-elfes', nom: 'Les Sœurs Elfes', lien: 'https://elfes.fmenguy.fr/' },
  { depot: 'mcp-pilotage', nom: 'mcp-pilotage', lien: 'https://github.com/fmenguy/mcp-pilotage' },
  { depot: 'prompt', nom: 'Générateur de prompt', lien: 'https://github.com/fmenguy/prompt' },
  { depot: 'cuisine', nom: 'Cuisine', lien: 'https://cuisine.fmenguy.fr/' },
  { depot: 'veille-auto-multi-agent', nom: 'Veille multi-agents', lien: 'https://github.com/fmenguy/veille-auto-multi-agent' },
  { depot: 'wanda-aiart', nom: 'Wanda AI Art', lien: 'https://wanda-aiart.org/' },
];

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Palette validée (scripts/validate_palette.js de la skill dataviz) contre les fonds de GitHub
const THEMES = {
  clair: { barre: '#2a78d6', texte: '#0b0b0b', texte2: '#52514e', grille: '#e1e0d9' },
  sombre: { barre: '#3987e5', texte: '#f0efec', texte2: '#c3c2b7', grille: '#30363d' },
};

const nombre = (n) => n.toLocaleString('fr-FR');
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cleMois = (d) => d.toISOString().slice(0, 7);

async function api(chemin, options = {}) {
  const r = await fetch(chemin.startsWith('http') ? chemin : API + chemin, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', ...options.headers },
  });
  if (r.status === 409) return { donnees: [], suivant: null }; // dépôt vide
  if (!r.ok) throw new Error(`${chemin} : ${r.status} ${await r.text()}`);
  const suivant = r.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  return { donnees: await r.json(), suivant };
}

async function toutesLesPages(chemin) {
  const tout = [];
  for (let page = chemin; page;) {
    const { donnees, suivant } = await api(page);
    tout.push(...donnees);
    page = suivant;
  }
  return tout;
}

// Contributions jour par jour sur douze mois (le calendrier vert du profil, privé compris)
async function contributionsParMois(debut, fin) {
  const { donnees } = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) { contributionsCollection(from: $from, to: $to) {
          contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`,
      variables: { login: UTILISATEUR, from: debut.toISOString(), to: fin.toISOString() },
    }),
  });
  if (donnees.errors) throw new Error(JSON.stringify(donnees.errors));
  const parMois = new Map();
  for (const semaine of donnees.data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const jour of semaine.contributionDays) {
      const cle = jour.date.slice(0, 7);
      parMois.set(cle, (parMois.get(cle) ?? 0) + jour.contributionCount);
    }
  }
  return parMois;
}

// Commits de l'utilisateur sur la branche principale de chaque dépôt, et octets par langage
async function parDepot(debut, maintenant) {
  const depots = (await toutesLesPages(`/user/repos?affiliation=owner&per_page=100`)).filter((d) => !d.fork);
  const il30j = new Date(maintenant.getTime() - 30 * 86400000);
  const lignes = [];
  const langages = new Map();
  for (const d of depots) {
    const commits = await toutesLesPages(
      `/repos/${d.full_name}/commits?author=${UTILISATEUR}&since=${debut.toISOString()}&per_page=100`);
    const dates = commits.map((c) => new Date(c.commit.author.date));
    lignes.push({
      depot: d.name, prive: d.private, total: dates.length,
      recents: dates.filter((x) => x >= il30j).length,
      dernier: dates.length ? new Date(Math.max(...dates)) : null,
    });
    const { donnees } = await api(`/repos/${d.full_name}/languages`);
    for (const [langage, octets] of Object.entries(donnees)) langages.set(langage, (langages.get(langage) ?? 0) + octets);
  }
  return { lignes, langages };
}

const arrondiHaut = (v) => {
  const pas = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  return Math.ceil(v / pas) * pas;
};

// Colonnes : 24 px au plus, bout arrondi de 4 px, base carrée
function colonne(x, y, l, h, classe) {
  if (h <= 0) return '';
  const r = Math.min(4, h, l / 2);
  return `<path class="${classe}" d="M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + l - r}Q${x + l},${y} ${x + l},${y + r}V${y + h}Z"/>`;
}

function enTete(largeur, hauteur, theme, titre, sousTitre) {
  const t = THEMES[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="${xml(titre)}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}.t1{fill:${t.texte}}.t2{fill:${t.texte2}}.g{stroke:${t.grille};stroke-width:1}.b{fill:${t.barre}}</style>
<text class="t1" x="0" y="20" font-size="16" font-weight="600">${xml(titre)}</text>
<text class="t2" x="0" y="42" font-size="13">${xml(sousTitre)}</text>`;
}

function svgContributions(mois, theme, majLe) {
  const L = 800, H = 262, haut = 70, bas = 40, gauche = 44;
  const base = H - bas, zone = base - haut;
  const max = arrondiHaut(Math.max(...mois.map((m) => m.total)));
  const fente = (L - gauche) / mois.length, epaisseur = 24;
  const total = mois.reduce((s, m) => s + m.total, 0);
  const iMax = mois.reduce((im, m, i) => (m.total > mois[im].total ? i : im), 0);
  const etiquetees = new Set([iMax, mois.length - 1]);
  let corps = '';
  for (const v of [max / 2, max]) {
    const y = base - (v / max) * zone;
    corps += `<line class="g" x1="${gauche}" x2="${L}" y1="${y}" y2="${y}"/><text class="t2" x="${gauche - 8}" y="${y + 4}" font-size="11" text-anchor="end">${nombre(v)}</text>`;
  }
  corps += `<line class="g" x1="${gauche}" x2="${L}" y1="${base}" y2="${base}"/>`;
  mois.forEach((m, i) => {
    const h = (m.total / max) * zone;
    const x = gauche + i * fente + (fente - epaisseur) / 2;
    corps += colonne(x, base - h, epaisseur, h, 'b');
    if (etiquetees.has(i)) {
      corps += `<text class="t1" x="${x + epaisseur / 2}" y="${base - h - 6}" font-size="12" font-weight="600" text-anchor="middle">${nombre(m.total)}</text>`;
    }
    corps += `<text class="t2" x="${x + epaisseur / 2}" y="${base + 18}" font-size="11" text-anchor="middle">${m.libelle}</text>`;
    if (i === mois.length - 1) {
      corps += `<text class="t2" x="${x + epaisseur / 2}" y="${base + 32}" font-size="10" text-anchor="middle">en cours</text>`;
    }
  });
  return enTete(L, H, theme, 'Contributions par mois',
    `${nombre(total)} sur douze mois, dépôts privés compris. Mis à jour le ${majLe}.`) + corps + '</svg>\n';
}

function svgLangages(parts, theme) {
  const L = 800, ligne = 30, haut = 62, etiquette = 150, largeurMax = 560;
  const H = haut + parts.length * ligne + 6;
  const max = Math.max(...parts.map((p) => p.part));
  let corps = '';
  parts.forEach((p, i) => {
    const y = haut + i * ligne;
    const l = Math.max(2, (p.part / max) * largeurMax);
    const r = Math.min(4, l / 2);
    corps += `<text class="t1" x="0" y="${y + 15}" font-size="13">${xml(p.nom)}</text>`;
    corps += `<path class="b" d="M${etiquette},${y + 2}H${etiquette + l - r}Q${etiquette + l},${y + 2} ${etiquette + l},${y + 2 + r}V${y + 18 - r}Q${etiquette + l},${y + 18} ${etiquette + l - r},${y + 18}H${etiquette}Z"/>`;
    corps += `<text class="t2" x="${etiquette + l + 8}" y="${y + 15}" font-size="12">${p.part.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</text>`;
  });
  return enTete(L, H, theme, 'Langages', 'Part du code de tous mes dépôts, privés compris.') + corps + '</svg>\n';
}

const image = (nom, alt) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="stats/${nom}-sombre.svg">
  <img src="stats/${nom}-clair.svg" alt="${alt}" width="100%">
</picture>`;

async function main() {
  if (!TOKEN) throw new Error('GH_TOKEN manquant : un jeton en lecture seule sur tous les dépôts est nécessaire.');
  const maintenant = new Date();
  const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - 11, 1));
  const majLe = maintenant.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });

  const parMois = await contributionsParMois(debut, maintenant);
  const mois = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + i, 1));
    return { cle: cleMois(d), libelle: MOIS[d.getUTCMonth()], annee: d.getUTCFullYear(), total: parMois.get(cleMois(d)) ?? 0 };
  });

  const { lignes, langages } = await parDepot(debut, maintenant);
  const totalOctets = [...langages.values()].reduce((s, v) => s + v, 0);
  const tries = [...langages.entries()].sort((a, b) => b[1] - a[1]);
  const parts = tries.slice(0, 8).map(([nom, o]) => ({ nom, part: (o / totalOctets) * 100 }));
  const reste = tries.slice(8).reduce((s, [, o]) => s + o, 0);
  if (reste) parts.push({ nom: 'Autres', part: (reste / totalOctets) * 100 });

  await mkdir('stats', { recursive: true });
  for (const theme of Object.keys(THEMES)) {
    await writeFile(`stats/contributions-${theme}.svg`, svgContributions(mois, theme, majLe));
    await writeFile(`stats/langages-${theme}.svg`, svgLangages(parts, theme));
  }

  // Tableau par projet : les projets nommés, puis le reste des dépôts privés regroupé
  // Un dépôt public absent de PROJETS est nommé quand même : son nom est déjà visible sur le profil
  const connus = new Map(PROJETS.map((p) => [p.depot, p]));
  const projet = (l) => connus.get(l.depot) ?? (!l.prive && { nom: l.depot, lien: `https://github.com/${UTILISATEUR}/${l.depot}` });
  const nommes = lignes.filter((l) => projet(l) && l.total > 0).sort((a, b) => b.total - a.total);
  const autres = lignes.filter((l) => !projet(l) && l.total > 0);
  const date = (d) => (d ? d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : '');
  const rangees = nommes.map((l) => {
    const p = projet(l);
    return `| [${p.nom}](${p.lien}) | ${l.prive ? 'privé' : 'public'} | ${nombre(l.total)} | ${nombre(l.recents)} | ${date(l.dernier)} |`;
  });
  if (autres.length) {
    const dernier = new Date(Math.max(...autres.filter((l) => l.dernier).map((l) => l.dernier)));
    rangees.push(`| ${autres.length} autres projets | privés | ${nombre(autres.reduce((s, l) => s + l.total, 0))} | ${nombre(autres.reduce((s, l) => s + l.recents, 0))} | ${date(dernier)} |`);
  }
  const totalCommits = lignes.reduce((s, l) => s + l.total, 0);

  const section = `<!-- ACTIVITE:DEBUT -->
${image('contributions', 'Contributions par mois sur douze mois, dépôts privés compris')}

<details>
<summary>Les chiffres, mois par mois</summary>

| Mois | Contributions |
|---|---:|
${mois.map((m) => `| ${m.libelle} ${m.annee} | ${nombre(m.total)} |`).join('\n')}

</details>

**${nombre(totalCommits)} commits en douze mois**, dont la plupart dans des dépôts privés :

| Projet | Dépôt | Commits (12 mois) | 30 derniers jours | Dernier commit |
|---|---|---:|---:|---|
${rangees.join('\n')}

${image('langages', 'Part de chaque langage dans le code de tous mes dépôts')}

<details>
<summary>Les chiffres, langage par langage</summary>

| Langage | Part du code |
|---|---:|
${parts.map((p) => `| ${p.nom} | ${p.part.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % |`).join('\n')}

</details>

<sub>Calculé chaque jour par [une GitHub Action](.github/workflows/activite.yml) avec un jeton en lecture seule. Dernière mise à jour : ${majLe}.</sub>
<!-- ACTIVITE:FIN -->`;

  const readme = await readFile('README.md', 'utf8');
  const motif = /<!-- ACTIVITE:DEBUT -->[\s\S]*<!-- ACTIVITE:FIN -->/;
  if (!motif.test(readme)) throw new Error('Marqueurs ACTIVITE:DEBUT et ACTIVITE:FIN absents du README');
  await writeFile('README.md', readme.replace(motif, section));
  console.log(`${nombre(mois.reduce((s, m) => s + m.total, 0))} contributions, ${nombre(totalCommits)} commits, ${lignes.length} dépôts, ${langages.size} langages`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
