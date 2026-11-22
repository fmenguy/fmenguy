/* ---------- générateur de prompt : 15 sections, dans l'ordre imposé ---------- */
const SECTIONS = ["Titre et description", "Idée générale", "Assets", "Polices", "Tokens de couleur", "Head", "Système d'échelle", "Layout", "Moteur de mouvement", "États et interactions", "Entrée au chargement", "Variantes d'écran", "prefers-reduced-motion", "Checklist d'acceptation", "Annexe"];
const LAST_LINE = "Aucun texte autre que celui listé, aucune décoration supplémentaire.";
const FILTER_SVG = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="alpha-clean" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.1" intercept="-0.1"/></feComponentTransfer></filter></svg>';
const q = s => "« " + clean(s) + " »";
const nearW = (list, n) => (list && list.length ? list.map(Number).reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a)) : n);

function assetURLs(st) {
  const a = st.assets, name = (o, d) => o.url || ("assets/" + (o.name || d));
  return {
    sprite: name(a.sprite, "sprite.png"),
    variants: Array.from({ length: 9 }, (_, i) => name(a.variants[i] || {}, "variante-" + i + ".png")),
    images: st.items.map((_, i) => name(a.images[i] || {}, "image-" + (i + 1) + ".jpg")),
    ar: name(a.ar, "fond-ar.jpg")
  };
}
const cellPos = (sp, c) => (sp.cols > 1 ? pct(c.col / (sp.cols - 1) * 100) : "0%") + " " + (sp.rows > 1 ? pct(c.row / (sp.rows - 1) * 100) : "0%");

function textList(st) {
  const k = st.copy, out = [["Logo", st.brand.name]];
  copyFields(st).forEach(f => { if (k[f.k]) out.push([f.l, k[f.k]]); });
  if (st.arch === "tryon") {
    st.tryon.slots.forEach(sl => { out.push(["Zone", sl.label]); sl.opts.forEach(o => { out.push(["Pièce, " + sl.label, o.name]); out.push(["Prix, " + o.name, o.price]); }); });
    st.tryon.looks.forEach(l => out.push(["Look du styliste", l.name]));
  } else {
    st.items.forEach((it, i) => {
      out.push(["Nom " + (i + 1), it.name]); if (it.tag) out.push(["Catégorie " + (i + 1), it.tag]); out.push(["Prix ou méta " + (i + 1), it.price]); if (it.desc) out.push(["Description " + (i + 1), it.desc]);
      if (eff(st).swatches && ARCH[st.arch].assets === "sprite") it.colors.forEach(c => c.name && out.push(["Coloris, " + it.name, c.name]));
    });
  }
  const seen = new Set();
  return out.filter(([l, v]) => v && !seen.has(l + "|" + v) && seen.add(l + "|" + v)).map(([l, v]) => [l, clean(v)]);
}

/* Spécifications par archétype. Chaque nombre vient de ARCH[...].K, que le gabarit exécute aussi. */
const SPEC = {
  ring(st, K, I) {
    const L = K.L, P = K.P, N = st.items.length, k = st.copy;
    return {
      one: `Hero plein écran sans défilement où ${N} produits détourés flottent sur un anneau horizontal qui tourne en continu.`,
      idea: `La page tient dans un seul écran, sans barre de défilement. En haut, une bande porte le logo à gauche, trois liens au centre${I.cart ? " et le panier à droite" : ""}. Au centre, ${N} visuels détourés tournent sur un anneau horizontal vu légèrement de dessus : la pièce de devant est la plus grande, celles de derrière sont plus petites et remontées. Un mot fantôme géant occupe le fond, et une légende sous l'anneau donne le nom et le prix de la pièce de devant.${I.drag ? " On fait tourner l'anneau en le glissant ; un lancer le laisse filer avant qu'il ne retrouve sa vitesse de croisière." : ""}${I.product ? " Un clic sur une pièce ouvre la vue produit : la pièce glisse à gauche et grandit, les autres s'écartent hors champ, la fiche apparaît à droite" + (I.swatches ? " avec ses pastilles de couleur" : "") + (I.cart ? " et un bouton d'achat qui envoie la pièce vers le panier le long d'une courbe" : "") + "." : ""} En bas, un indice d'interaction à gauche et une note à droite.`,
      layout: [
        `Mot fantôme ${q(k.ghost)} : centré en (720, 430) ; police titre ; 330 px ; interligne 1 ; interlettrage -0.04em ; couleur --ghost ; derrière tout ; aria-hidden.`,
        `Titre h1 ${q(k.title)} : left 60, top 118 ; police titre ; 20 px ; interlettrage 0.04em ; capitales. Sous titre ${q(k.subtitle)} : 6 px sous le titre ; police texte ; 14 px ; --text-2.`,
        `Pièces : ${N} boutons carrés de ${L.S0} px, recadrés dans la feuille de sprites, origine de transformation au centre, placés par le moteur (section 9).`,
        `Légende : centrée sur x = 720, top 690, texte centré ; nom en police titre, 26 px, plancher 13 px ; prix dessous en 14 px, interlettrage 0.04em, --text-2.`,
        I.product ? `Vue produit : panneau left 800, top 200, largeur 500, pile verticale alignée à gauche, écart 18 : catégorie (11 px, interlettrage 0.1em, capitales, --text-2) ; nom h2 (police titre, 64 px, interligne 0.95, interlettrage -0.02em) ; description (16 px, interligne 1.45, --text-2, largeur max 400)${" ; prix (police titre, 28 px)"}${I.swatches ? " ; pastilles rondes de 28 px, écart 10, bord 1 px --line, la pastille active entourée d'un anneau de 1.5 px --text décalé de 5 px" : ""}${I.cart ? ` ; bouton ${q(k.cta)} (hauteur 52, marge intérieure horizontale 28, fond --text, texte --bg, 13 px, graisse 600, interlettrage 0.08em, capitales, fond --accent au survol)` : ""} ; lien ${q(k.back)} (12 px, interlettrage 0.06em, capitales, souligné, --text-2).` : null
      ],
      engine: [
        `État : th (angle de base, radians), v (vitesse angulaire, rad/s), d (blend de la vue produit, de 0 à 1), sel (indice de la pièce ouverte, ou -1). Un seul angle de base pilote toutes les pièces.`,
        `Constantes : N = ${N} ; CX = ${L.CX} ; CY = ${L.CY} ; R = ${L.R} ; DROP = ${L.DROP} ; S0 = ${L.S0} ; TILT = ${K.TILT} degrés ; OMEGA = ${K.OMEGA} rad/s.`,
        `Pour la pièce i : θ = th + i × 2π / N ; k = (1 + cos θ) / 2, qui vaut 1 devant et 0 derrière.`,
        `x = CX + R × sin θ ; y = CY + (1 - k) × DROP ; échelle = 0.72 + 0.28 × k, appliquée au carré de S0 ; rotation = TILT × sin θ degrés ; z-index = round(k × 100).`,
        `Écriture : transform: translate(x × s px, y × s px) translate(-50%, -50%) rotate(rotation) scale(échelle), où s est la valeur en px de l'unité scène.`,
        `Rotation continue, à chaque image : v = OMEGA + (v - OMEGA) × ${K.DAMP}^(dt × 60), puis th += v × dt × (1 - d). dt en secondes, plafonné à 0.05.`,
        I.drag ? `Drag : pointerdown sur la scène, pointermove et pointerup écoutés sur window. À chaque mouvement dθ = dx / (R × s) ; th += dθ ; vitesse lissée vs = vs × ${1 - K.SMOOTH} + (dθ / dt) × ${K.SMOOTH}. Fling : au relâchement v = vs, ou 0 si le pointeur est resté immobile plus de 90 ms ; l'amortissement ${K.DAMP}^(dt × 60) ramène ensuite v vers OMEGA.` : null,
        I.product ? `Clic : un relâchement avec moins de ${K.CLICK} px de déplacement cumulé. Il ouvre la vue produit : d passe de 0 à 1 en ${K.OPEN} ms avec easeOutCubic, 1 - (1 - t)^3 ; la fermeture ramène d à 0 en ${K.CLOSE} ms, même courbe.` : null,
        I.product ? `Pièce ouverte : x = lerp(x, PX, d) ; y = lerp(y, PY, d) ; échelle = lerp(échelle, S1 / S0, d) ; rotation = lerp(rotation, 0, d) ; z-index 200. PX = ${L.PX} ; PY = ${L.PY} ; S1 = ${L.S1}.` : null,
        I.product ? `Autres pièces : x += signe × SPREAD × d, où signe = 1 si sin θ ≥ 0, sinon -1, et SPREAD = ${L.SPREAD} ; opacité = 1 - d. Panneau : opacité = d et translateX((1 - d) × 40 × s px). Légende : opacité = 1 - d.` : null,
        I.hover ? `Survol : chaque pièce garde h entre 0 et 1 ; h += (cible - h) × (1 - 0.85^(dt × 60)), cible = 1 sous le pointeur ; échelle × (1 + ${K.HOVER} × h). Inactif au tactile et quand d > 0.` : null,
        I.swatches ? `Pastilles : opacité de la pièce de 1 à 0 en 110 ms, changement de background-position vers la ligne du coloris, puis de 0 à 1 en 110 ms.` : null,
        I.cart ? `Vol vers le panier : un clone de la pièce suit une courbe de Bézier quadratique B(t) = (1 - t)² P0 + 2(1 - t)t P1 + t² P2, avec P0 = centre de la pièce, P2 = centre du badge du panier, P1 = ((P0.x + P2.x) / 2, min(P0.y, P2.y) - 180 × s). Durée ${K.FLY} ms ; easeInOutCubic ; échelle de 1 à 0.18 ; opacité 1 jusqu'à 85 % du trajet puis fondu linéaire jusqu'à 0. À l'arrivée : compteur + 1 et rebond du badge, scale 1, 1.25, 1 en 260 ms.` : null
      ],
      states: [
        I.product ? `Vue produit ouverte : la rotation est gelée par le facteur (1 - d) ; le panneau reçoit role="dialog", aria-modal="false" et aria-labelledby vers son h2 ; le focus va sur le lien ${q(k.back)} ; Échap ou ce lien referme et rend le focus à la pièce. Panneau fermé : attribut inert.` : null,
        `Clavier : les pièces sont des boutons atteignables à la tabulation, aria-label « nom, prix »${I.product ? ", Entrée ouvre la vue produit" : ""}. Flèche gauche ou droite : th avance d'un cran de 2π / N en ${K.STEP} ms, easeOutCubic.`,
        `Accessibilité : la scène porte role="group", aria-roledescription="carrousel" ; la légende est en aria-live="polite"${I.swatches ? ' ; les pastilles forment un role="radiogroup" de boutons role="radio" avec aria-checked et aria-label au nom du coloris' : ""}${I.cart ? " ; le compteur du panier est en aria-live=\"polite\"" : ""}. Focus visible : contour 2 px --accent décalé de 3 px.`,
        I.drag ? `Curseur grab sur la scène, grabbing pendant le drag ; touch-action: pan-y.` : null
      ],
      entrance: [
        `0 ms : bande haute et pied en fondu de 0 à 1 en 600 ms.`,
        `100 ms : mot fantôme en fondu en 800 ms.`,
        `200 ms + i × 70 ms : la pièce i passe de l'opacité 0 à 1 et de 60 % à 100 % de son échelle en 600 ms, easeOutCubic. L'anneau tourne déjà pendant l'entrée.`,
        `900 ms : légende en fondu en 500 ms.`
      ],
      mobile: [
        `Portrait, cadre 390 par 844 : CX = ${P.CX} ; CY = ${P.CY} ; R = ${P.R} ; DROP = ${P.DROP} ; S0 = ${P.S0}. Mot fantôme : 120 px, centré en (195, 330). Titre : left 20, top 70. Légende : top 470.`,
        I.product ? `Portrait, vue produit : PX = ${P.PX} ; PY = ${P.PY} ; S1 = ${P.S1} ; SPREAD = ${P.SPREAD}. Panneau : left 24, top 410, largeur 342, écart 12 ; nom 36 px ; description 14 px ; prix 20 px ; bouton hauteur 46.` : null,
        `Paysage mobile (hauteur sous 500 px) : mêmes constantes que le bureau ; l'unité scène réduit tout l'anneau, les planchers de texte s'appliquent.`
      ],
      reduced: [
        `Coupé : rotation continue (OMEGA = 0), inertie du fling, entrée échelonnée, fondus du blend (d passe de 0 à 1 sans transition), vol vers le panier (le compteur change directement).`,
        `Conservé : drag direct, flèches du clavier, vue produit, changement de coloris.`
      ],
      checks: [
        `Avec N = ${N}, la pièce de devant mesure ${L.S0} px et la pièce opposée ${Math.round(L.S0 * 0.72)} px (échelle 0.72).`,
        `La pièce de devant est à y = ${L.CY}, la pièce de derrière à y = ${L.CY + L.DROP}.`,
        `Sans interaction, un tour complet dure ${(Math.PI * 2 / K.OMEGA).toFixed(2)} s (2π / OMEGA).`,
        I.drag ? `Après un lancer, la vitesse revient à OMEGA sans à coup ; un glissement de R × s px fait tourner l'anneau de 1 radian.` : null,
        I.product ? `Clic sur une pièce : elle arrive en (${L.PX}, ${L.PY}) à ${L.S1} px en ${K.OPEN} ms ; les autres sortent à opacité 0 ; Échap referme en ${K.CLOSE} ms.` : null,
        I.cart ? `Le bouton d'achat fait voler un clone en ${K.FLY} ms le long de la courbe et incrémente le badge.` : null,
        `Un seul fichier d'image est chargé : la feuille de sprites.`
      ]
    };
  },
  tryon(st, K, I) {
    const k = st.copy, T = st.tryon, a = st.assets;
    return {
      one: `Salon d'essayage virtuel en trois colonnes où un mannequin change de tenue pièce par pièce grâce à un compositeur canvas à masques.`,
      idea: `La page tient dans un seul écran. À gauche, la boutique liste les pièces par zone (${T.slots.map(s => s.label.toLowerCase()).join(", ")})${I.search ? ", avec un champ de recherche" : ""}${I.filters ? " et des filtres" : ""}. Au centre, le mannequin est dessiné dans un canvas : chaque clic sur une pièce remplace la zone concernée par la variante, et une ligne de balayage descend sur le mannequin pour révéler la nouvelle tenue.${I.drag ? " Le mannequin pivote sur sa plateforme quand on le glisse, entre -" + K.ROTMAX + " et " + K.ROTMAX + " degrés." : ""}${I.ar ? " Un mode AR place une photo d'intérieur derrière lui." : ""} Un styliste automatique enchaîne des looks préconçus. À droite, le récapitulatif donne les pièces portées, le total, un score de style calculé${I.cart ? " et le bouton d'achat" : ""}.`,
      layout: [
        `Boutique : left 40, top 104, largeur 340, jusqu'à bottom 64, défilement interne. Titre h2 ${q(k.shopTitle)} (police titre, 30 px, interligne 1.05). Sous titre ${q(k.subtitle)} (13 px, --text-2).${I.search ? ` Recherche ${q(k.search)} : hauteur 38, filet bas 1 px --line, 13 px.` : ""}${I.filters ? ` Filtres : puces de hauteur 36, marge intérieure horizontale 16, rayon 99, bord 1 px --line, 12 px, graisse 500, interlettrage 0.06em, capitales ; puce active fond --text, texte --bg.` : ""}`,
        `Groupes de pièces : intitulé de zone (11 px, graisse 500, interlettrage 0.1em, capitales, --text-2), puis une option par pièce : bouton pleine largeur, marge intérieure 8 et 10, rayon 6, grille pastille ronde de 26 px, nom (14 px), prix (13 px, --text-2). Option portée : bord 1 px --text, fond --ghost, aria-pressed="true".`,
        `Mannequin : colonne left 420, top 92, largeur 600, jusqu'à bottom 56, rayon 10. Le mannequin fait 660 de haut, centré, top 4, au ratio ${a.vw} / ${a.vh} ; son parent porte perspective: 1400 (unité scène). Plateforme : ellipse de 380 par 56 centrée, bottom 66, fond --ghost, bord 1 px --line.`,
        `Outils : rangée centrée, bottom 8, écart 8, puces ${q(k.stylist)}${I.ar ? ", " + q(k.ar) : ""}, ${q(k.reset)} (même style que les filtres). Bulle du styliste : centrée, top 14, fond --text, texte --bg, 13 px, marge intérieure 8 et 14, rayon 99.`,
        `Récapitulatif : left 1060, top 104, largeur 340, écart 14. Titre h2 ${q(k.recapTitle)} (police titre, 30 px). Une ligne par zone : intitulé (11 px, capitales, --text-2), nom (14 px), prix à droite (14 px) ; filet haut 1 px --line. Total ${q(k.total)} : 15 px, graisse 600, filet haut. Score ${q(k.score)} : libellé 11 px capitales, nombre en police titre 64 px à chiffres tabulaires, jauge de 4 px (fond --line, remplissage --accent).${I.cart ? ` Bouton ${q(k.cta)} : hauteur 52, marge intérieure horizontale 28, fond --text, texte --bg, 13 px, graisse 600, interlettrage 0.08em, capitales.` : ""}`
      ],
      engine: [
        `Chargement : les 9 photos et les 8 masques sont chargés en Image avant le premier dessin. Deux canvas superposés A (dessous) et B (dessus), plus un canvas tampon hors écran, tous à la taille native des photos.`,
        `compose(tenue) sur un contexte 2D : (1) globalCompositeOperation = "source-over", drawImage(base). (2) Pour chaque zone dans l'ordre chaussures, jupe, haut, sac, si une variante v (1 ou 2) est portée, idx = zone × 2 + v - 1 : "destination-out" puis drawImage(masque[idx]) pour percer la base ; sur le tampon, "source-over" drawImage(variante[idx]) puis "destination-in" drawImage(masque[idx]) ; retour au contexte, "lighter" puis drawImage(tampon). (3) Remettre "source-over".`,
        `Changement de pièce : copier A dans B, composer la nouvelle tenue dans A, puis animer B avec clip-path: inset(p% 0 0 0), p de 0 à 100 en ${K.WIPE} ms, easeInOutCubic. La nouvelle tenue apparaît au dessus de la ligne, l'ancienne reste en dessous. Une ligne de 2 px --accent, plus large que le mannequin de 8 % de chaque côté, suit top = p %. À la fin, B passe à l'opacité 0.`,
        I.drag ? `Plateforme : en glissant horizontalement sur le mannequin, cible = clamp(cible + dx × ${K.ROTSENS}, -${K.ROTMAX}, ${K.ROTMAX}) degrés. À chaque image angle += (cible - angle) × (1 - ${K.ROTDAMP}^(dt × 60)) ; mannequin : rotateY(angle) ; plateforme : rotate(angle × 0.2). Double clic : cible = 0.` : null,
        `Score : score = min(100, ${K.SCORE_BASE} + somme des points des 4 pièces portées + ${K.SCORE_BONUS} si la tenue correspond exactement à un look préconçu). Les points de chaque pièce sont dans l'annexe. Le nombre affiché rejoint la nouvelle valeur en ${K.COUNT} ms, easeOutCubic, et la jauge a pour largeur score %.`,
        `Total : somme des prix des 4 pièces portées, même format que les prix.`,
        `Styliste : au clic, parcourt les looks en boucle. Pour un look, la bulle affiche son nom, puis les zones qui diffèrent changent une à une toutes les ${K.STY_STEP} ms, chacune avec son balayage ; pause de ${K.STY_PAUSE} ms après la dernière, puis look suivant. Toute action manuelle sur une pièce arrête le styliste.`,
        I.ar ? `Mode AR : la colonne du mannequin reçoit la photo de fond en background-size: cover, centrée ; la plateforme passe à l'opacité 0.35. Les photos du mannequin étant détourées, il se pose sur le décor.` : null,
        I.hover ? `Survol d'une option : fond --ghost en 150 ms.` : null
      ],
      states: [
        `État initial : tenue de base, toutes les options de base en aria-pressed="true", score = ${K.SCORE_BASE} + points des 4 pièces de base.`,
        `Clavier : chaque option est un bouton ; le mannequin est focusable (tabindex="0", role="img", aria-label ${q(k.title)}) et les flèches gauche et droite déplacent la cible de ${K.ROTMAX / 4} degrés.`,
        `Accessibilité : les trois colonnes sont des section avec aria-label ; les puces portent aria-pressed ; la bulle du styliste est en aria-live="polite". Focus visible : contour 2 px --accent décalé de 3 px.`,
        I.search ? `Recherche : filtre à la frappe sur le nom des pièces, sans tenir compte de la casse ; un groupe sans résultat disparaît.` : null,
        I.filters ? `Filtres : ${q(k.filterAll)} montre tous les groupes ; une puce de zone ne montre que son groupe.` : null,
        I.cart ? `Bouton d'achat : compteur du panier + 1 et rebond du badge, scale 1, 1.25, 1 en 260 ms.` : null
      ],
      entrance: [
        `0 ms : bande haute et pied en fondu en 600 ms.`,
        `Dès que les 17 images sont chargées : le mannequin monte de 3 % de sa hauteur et passe de l'opacité 0 à 1 en 700 ms, cubic-bezier(.22, 1, .36, 1).`,
        `Les colonnes boutique et récapitulatif sont visibles dès le premier rendu, sans animation.`
      ],
      mobile: [
        `Portrait, cadre 390 par 844 : mannequin en haut (colonne left 0, top 56, largeur 390, hauteur 400 ; mannequin de 330 de haut ; plateforme 200 par 30, bottom 48). Boutique dessous : left 16, top 464, largeur 358, hauteur 206, défilement interne, titre masqué. Récapitulatif réduit : left 16, top 678, largeur 358, le total, le score (26 px) avec sa jauge sur une ligne, puis le bouton (hauteur 40).`,
        `Paysage mobile : même mise en page que le bureau, réduite par l'unité scène.`
      ],
      reduced: [
        `Coupé : ligne de balayage (la nouvelle tenue remplace l'ancienne d'un coup), lissage de la rotation (l'angle suit la cible directement), comptage du score, entrée du mannequin. Le styliste applique chaque look en une fois.`,
        `Conservé : essayage, rotation manuelle, mode AR, score et total.`
      ],
      checks: [
        `Les 9 photos se superposent au pixel près : en changeant une seule pièce, rien d'autre ne bouge.`,
        `Porter la variante 1 de chaque zone donne le même rendu, quel que soit l'ordre des clics.`,
        `Le balayage dure ${K.WIPE} ms et la nouvelle tenue est visible au dessus de la ligne.`,
        I.drag ? `La rotation ne dépasse jamais ${K.ROTMAX} degrés d'un côté ou de l'autre.` : null,
        `Tenue de base : score ${Math.min(100, K.SCORE_BASE + T.slots.reduce((t, s) => t + (+s.opts[0].pts || 0), 0))}. Premier look du styliste : score ${Math.min(100, K.SCORE_BASE + K.SCORE_BONUS + T.slots.reduce((t, s, i) => t + (+s.opts[T.looks[0].pick[i]].pts || 0), 0))}.`,
        `Les masques sont lus depuis l'annexe, sans requête réseau.`
      ]
    };
  },
  stack(st, K, I) {
    const N = st.items.length, k = st.copy;
    return {
      one: `Hero plein écran où ${N} cartes produit forment une pile décalée ; la carte de devant s'envole et repasse derrière.`,
      idea: `La page tient dans un seul écran. Au centre, ${N} cartes sont empilées avec un léger décalage vers la droite et vers le haut, chacune un peu plus petite et plus pâle que la précédente. Toutes les ${K.AUTO} ms, la carte de devant part sur le côté en pivotant, puis reprend sa place au fond de la pile.${I.drag ? " On peut aussi la saisir et la jeter." : ""} Sous la pile, deux flèches et un compteur. Un mot fantôme occupe le fond.`,
      layout: [
        `Mot fantôme ${q(k.ghost)} : centré en (720, 450) ; police titre ; 300 px ; interlettrage -0.04em ; --ghost ; aria-hidden.`,
        `Titre h1 ${q(k.title)} : left 60, top 118 ; police titre ; 20 px ; interlettrage 0.04em ; capitales. Sous titre ${q(k.subtitle)} : 14 px, --text-2.`,
        `Pile : origine en (720, 450). Carte : ${K.CW} par ${K.CH}, centrée sur l'origine, fond --bg, bord 1 px --line, rayon 18, marge intérieure 22, contenu centré en colonne, écart 8 : visuel carré de 250 px recadré dans la feuille de sprites ; nom (police titre, 24 px) ; prix (14 px, --text-2)${I.swatches || I.cart ? " ; en bas, une rangée" + (I.swatches ? " de pastilles de 20 px" : "") + (I.cart ? ` avec le bouton ${q(k.cta)} (hauteur 40, marge intérieure horizontale 16, 11 px, graisse 600, capitales, fond --text, texte --bg)` : "") : ""}.`,
        `Pagination : centrée, top 760, écart 20 : flèche gauche, compteur au format « 01 / ${String(N).padStart(2, "0")} » (13 px, chiffres tabulaires, interlettrage 0.08em, --text-2), flèche droite. Flèches : cercles de 44 px, bord 1 px --line.`
      ],
      engine: [
        `État : a (indice de la carte de devant). Pour la carte i, profondeur j = (i - a) mod N.`,
        `transform: translate(-50%, -50%) translate(j × ${K.DX} px, j × ${K.DY} px) rotate(j × ${K.ROT} deg) scale(1 - j × ${K.SC}) ; opacité = 1 - j × ${K.FADE} si j ≤ ${K.VIS}, sinon 0 ; z-index = N - j. Les décalages sont en unité scène.`,
        `Toute modification de j s'anime en ${K.MOVE} ms, cubic-bezier(.4, 0, .2, 1), sur transform et opacity.`,
        `Avancer : la carte de devant reçoit translate(-${K.FLYX} px, 0) rotate(-${K.FLYROT} deg) et opacité 0 en ${K.OUT} ms, même courbe ; à la fin, a = (a + 1) mod N et toutes les cartes rejoignent leur nouvelle profondeur.`,
        `Lecture automatique : avancer toutes les ${K.AUTO} ms ; en pause tant que le pointeur survole la pile, qu'un drag est en cours ou que le focus est dans la page.`,
        I.drag ? `Drag de la carte de devant : elle suit dx et pivote de dx × ${K.DRAGROT} degrés, sans transition. Au relâchement, si |dx| > ${K.THRESH} px ou si la vitesse dépasse 0.6 px/ms, avancer dans le sens du geste ; sinon retour en 380 ms, cubic-bezier(.34, 1.56, .64, 1).` : null,
        I.swatches ? `Pastilles : changement immédiat de background-position du visuel de la carte.` : null,
        I.cart ? `Bouton d'achat : compteur + 1 et rebond du badge, scale 1, 1.25, 1 en 260 ms.` : null
      ],
      states: [
        `Seule la carte de devant est interactive ; les autres portent inert.`,
        `Clavier : flèche droite avance, flèche gauche recule (a = (a - 1) mod N, sans envol). Les flèches à l'écran font de même.`,
        `Accessibilité : la pile porte role="group", aria-roledescription="carrousel" ; chaque carte est un article avec aria-label « nom, prix » ; le compteur est en aria-live="polite". Focus visible : contour 2 px --accent décalé de 3 px.`
      ],
      entrance: [`0 ms : bande haute et pied en fondu en 600 ms.`, `Cartes : de la plus proche à la plus lointaine, décalage 80 ms ; chacune monte de 60 px et passe de l'opacité 0 à la sienne en 700 ms, cubic-bezier(.22, 1, .36, 1).`],
      mobile: [`Portrait, cadre 390 par 844 : origine de la pile en (180, 410) ; carte 250 par 380, marge intérieure 16, visuel 190 px, nom 18 px ; décalages et seuil multipliés par 0.72 ; mot fantôme 110 px ; pagination top 690.`, `Paysage mobile : mêmes valeurs que le bureau, réduites par l'unité scène.`],
      reduced: [`Coupé : lecture automatique, envol de la carte, transitions de profondeur, entrée.`, `Conservé : flèches, clavier, drag avec changement immédiat.`],
      checks: [`La deuxième carte est décalée de ${K.DX} px à droite et ${-K.DY} px vers le haut, tournée de ${K.ROT} degrés, à l'échelle ${1 - K.SC}.`, `Au plus ${K.VIS + 1} cartes sont visibles.`, `Sans interaction, la carte de devant change toutes les ${K.AUTO} ms.`, `Après ${N} avancées, la première carte est revenue devant.`, `Un seul fichier d'image est chargé : la feuille de sprites.`]
    };
  },
  rail(st, K, I) {
    const N = st.items.length, k = st.copy;
    return {
      one: `Hero plein écran traversé par une rangée infinie de ${N} produits qui glisse sur un filet horizontal.`,
      idea: `La page tient dans un seul écran. Un grand titre centré en haut, puis une rangée de produits détourés qui défile sans fin vers la gauche, posée sur un filet. Chaque pièce flotte légèrement ; celle qui passe au centre grossit et son étiquette apparaît.${I.hover ? " Le pointeur ralentit le rail et soulève la pièce survolée." : ""}${I.drag ? " On peut tirer le rail dans les deux sens et le lancer." : ""} Un mot fantôme occupe le bas de l'écran.`,
      layout: [
        `Titre h1 ${q(k.title)} : centré, top 130 ; police titre ; 76 px ; interligne 1 ; interlettrage -0.02em. Sous titre ${q(k.subtitle)} : centré, 14 px dessous ; 18 px ; --text-2.`,
        `Mot fantôme ${q(k.ghost)} : centré en (720, 760) ; police titre ; 190 px ; interlettrage -0.03em ; --ghost ; aria-hidden.`,
        `Filet : 1 px --line, pleine largeur de la fenêtre, top ${K.Y + K.CELL / 2 + 18}.`,
        `Pièce : bouton avec un visuel carré de ${K.CELL} px recadré dans la feuille de sprites, puis, 26 px dessous, une étiquette centrée : nom (police titre, 18 px) et prix (13 px, --text-2).`
      ],
      engine: [
        `La liste des ${N} produits est répétée M / N fois pour couvrir l'écran : M est le plus petit multiple de N tel que M × GAP ≥ 1440 + 2 × GAP.`,
        `Constantes : GAP = ${K.GAP} ; CX = 720 ; Y = ${K.Y} ; SPEED = ${K.SPEED} px/s ; FOCUS = ${K.FOCUS}.`,
        `État : p (défilement en px de design), v (vitesse). À chaque image : v = cible + (v - cible) × ${K.DAMP}^(dt × 60), cible = SPEED ; p += v × dt.`,
        `Pour la pièce i : x = mod(i × GAP - p, M × GAP) - floor(M / 2) × GAP + CX, avec mod toujours positif.`,
        `Focus : f = max(0, 1 - |x - CX| / FOCUS) ; échelle = 1 + ${K.ZOOM} × f ; opacité de l'étiquette = clamp((f - 0.5) × 2, 0, 1) ; z-index = round(f × 10).`,
        `Flottement : y = Y + ${K.BOB} × sin(t × ${K.BOBF} + i × ${K.PHASE}), t en secondes. Le centre du visuel est en (x, y).`,
        I.hover ? `Survol : tant qu'une pièce est survolée, cible = SPEED × ${(1 - K.SLOW).toFixed(1)} ; la pièce survolée monte de ${K.LIFT} px avec h += (cible - h) × (1 - 0.85^(dt × 60)) et son étiquette prend l'opacité h.` : null,
        I.drag ? `Drag : p -= dx / s ; vitesse lissée vs = vs × 0.8 + (-dx / dt) × 0.2 ; au relâchement v = vs, ou 0 après 90 ms d'immobilité ; l'amortissement ramène v vers SPEED.` : null,
        I.cart ? `Clic sur une pièce (moins de 6 px de déplacement) : compteur du panier + 1 et rebond du badge, scale 1, 1.25, 1 en 260 ms.` : null
      ],
      states: [
        `Clavier : flèche droite p += GAP, flèche gauche p -= GAP. Seule la première série de ${N} pièces est atteignable à la tabulation ; les répétitions portent tabindex="-1" et aria-hidden="true".`,
        `Accessibilité : le rail porte role="group" et un aria-label ; chaque pièce a un aria-label « nom, prix ». Focus visible : contour 2 px --accent décalé de 3 px.`,
        I.drag ? `Curseur grab sur la scène ; touch-action: pan-y.` : null
      ],
      entrance: [`0 ms : bande haute, titre et pied en fondu en 600 ms.`, `150 ms + (i mod 8) × 60 ms : chaque pièce monte de 40 px et passe de l'opacité 0 à 1 en 600 ms, easeOutCubic. Le rail défile déjà.`],
      mobile: [`Portrait, cadre 390 par 844 : GAP = 190 ; visuel de 150 px ; CX = 195 ; Y = 400 ; FOCUS = 190 ; titre 40 px sur 340 de large, top 110 ; sous titre 14 px ; filet top 489 ; mot fantôme 70 px, centré en (195, 700).`, `Paysage mobile : mêmes valeurs que le bureau, réduites par l'unité scène.`],
      reduced: [`Coupé : défilement automatique (SPEED = 0), flottement, entrée.`, `Conservé : drag direct sans inertie, flèches du clavier, agrandissement au centre.`],
      checks: [`Le rail avance de ${K.SPEED} px de design par seconde vers la gauche.`, `La pièce exactement au centre est à l'échelle ${1 + K.ZOOM} ; à ${K.FOCUS} px du centre et au delà, à l'échelle 1.`, `Aucun saut visible quand une pièce passe d'un bord à l'autre.`, `Un seul fichier d'image est chargé : la feuille de sprites.`]
    };
  },
  vhs(st, K, I) {
    const N = st.items.length, k = st.copy;
    return {
      one: `Portfolio plein écran façon archive vidéo : une liste de ${N} projets à gauche, un écran à droite traité comme une bande VHS.`,
      idea: `La page tient dans un seul écran. À gauche, sous le titre, la liste numérotée des projets en grands caractères.${I.filters ? " Des puces filtrent par catégorie." : ""} À droite, un écran aux coins arrondis montre l'image du projet actif avec lignes de balayage, décalage rouge et cyan, grain animé, barre de tracking qui descend et tremblement horizontal. En surimpression : l'étiquette d'enregistrement, l'indice du projet, son nom et un compteur d'images. Changer de projet déclenche un court parasite. Cet archétype attend une palette sombre.`,
      layout: [
        `Titre h1 ${q(k.title)} : left 60, top 112 ; police titre ; 20 px ; interlettrage 0.04em ; capitales. Sous titre ${q(k.subtitle)} : 14 px, --text-2.`,
        I.filters ? `Filtres : left 60, top 186, écart 6 ; puces de hauteur 36, marge intérieure horizontale 16, rayon 99, bord 1 px --line, 12 px, graisse 500, capitales ; active : fond --text, texte --bg. Première puce ${q(k.filterAll)}.` : null,
        `Liste : left 60, top 250, largeur 520, écart 4. Ligne : bouton pleine largeur, marge verticale 8, filet bas 1 px --line, grille de 3 colonnes (44 px, flexible, auto) : numéro « 01 » (12 px, chiffres tabulaires), nom (police titre, 38 px, interligne 1.05), méta (12 px, interlettrage 0.06em). Couleur --text-2 ; ligne active en --text avec le nom en --accent.`,
        `Écran : left 660, top 150, 720 par 540, fond #000, rayon 14, contenu rogné. Surimpressions en police monospace système, 16 px, blanc, ombre de texte 1 px magenta à droite et 1 px cyan à gauche : en haut (marges 18 et 22) à gauche un point rouge de 0.6em suivi de ${q(k.rec)}, à droite l'indice « 01 / ${String(N).padStart(2, "0")} » ; en bas à gauche le nom du projet, à droite le compteur « 00:00:00:00 ».`,
        `Description du projet actif : left 660, top 710, largeur 720 ; 14 px ; --text-2.`
      ],
      engine: [
        `Image : deux calques superposés de la même image en background-size: cover, mix-blend-mode: screen. Calque rouge : background-image: linear-gradient(#f00, #f00), url(image) avec background-blend-mode: multiply, translateX(-${K.SPLIT}px). Calque cyan : linear-gradient(#0ff, #0ff), url(image), multiply, translateX(${K.SPLIT}px).`,
        `Tremblement : le bloc image alterne translate(-1px, 0) et translate(1px, 0.5px), animation de ${K.JIT} ms, steps(2), infinie.`,
        `Lignes de balayage : repeating-linear-gradient(0deg, rgba(0,0,0,.4) 0 2px, transparent 2px 4px) par dessus l'image.`,
        `Barre de tracking : bande de 14 % de haut, linear-gradient(180deg, transparent, rgba(255,255,255,.16), transparent), top de -14 % à 100 % en ${K.TRACK} ms, linéaire, infinie.`,
        `Grain : canvas de 96 par 72 étiré sur l'écran, image-rendering: pixelated, opacité 0.08, mix-blend-mode: screen, rempli de gris aléatoires ${K.NOISE} fois par seconde.`,
        `Compteur : nombre d'images écoulées depuis le chargement à ${K.FPS} images par seconde, au format HH:MM:SS:II. Le point rouge clignote : opacité 1 puis 0, période 1 s, steps(2).`,
        `Changement de projet : parasite de ${K.GLITCH} ms en ${K.BANDS} pas de ${K.GLITCH / K.BANDS} ms. À chaque pas, le bloc image reçoit translate(x, 0) avec x tiré entre -${K.SHIFT} et ${K.SHIFT} px, et clip-path: inset(a% 0 b% 0) avec a et b tirés entre 0 et 60. L'image, le nom, l'indice et la description changent au pas ${Math.ceil(K.BANDS / 2)} ; au dernier pas, translate et clip-path sont retirés.`,
        I.hover ? `Survol d'une ligne à la souris : elle devient le projet actif.` : null
      ],
      states: [
        `Projet actif : aria-current="true" sur sa ligne. Clic ou focus sur une ligne l'active.`,
        `Clavier : flèche bas et flèche haut déplacent le focus dans la liste, en boucle, parmi les lignes visibles.`,
        `Accessibilité : la liste porte role="listbox", chaque ligne role="option" ; l'écran est aria-hidden="true" ; la description est en aria-live="polite". Focus visible : contour 2 px --accent décalé de 3 px.`,
        I.filters ? `Filtres : une puce masque les lignes des autres catégories et active la première ligne visible.` : null
      ],
      entrance: [`0 ms : bande haute et pied en fondu en 600 ms ; l'écran affiche déjà le premier projet.`, `200 ms + i × 60 ms : chaque ligne glisse de 24 px depuis la gauche et passe de l'opacité 0 à 1 en 500 ms, cubic-bezier(.22, 1, .36, 1).`],
      mobile: [`Portrait, cadre 390 par 844 : écran left 20, top 170, 350 par 262 ; description left 20, top 442 ; liste left 20, top 500, largeur 350, nom 22 px, première colonne 30 px${I.filters ? " ; filtres left 20, top 126" : ""}.`, `Paysage mobile : mêmes valeurs que le bureau, réduites par l'unité scène.`],
      reduced: [`Coupé : tremblement, barre de tracking, clignotement, rafraîchissement du grain (une seule image fixe), parasite de changement (bascule immédiate), compteur (figé à 00:00:00:00), entrée des lignes.`, `Conservé : lignes de balayage, décalage rouge et cyan, navigation.`],
      checks: [`Le décalage entre le calque rouge et le calque cyan est de ${K.SPLIT * 2} px.`, `Le compteur avance de ${K.FPS} images par seconde et la dernière paire de chiffres reste entre 00 et ${K.FPS - 1}.`, `Le parasite dure ${K.GLITCH} ms, puis l'image est nette et à sa place.`, `La barre de tracking traverse l'écran en ${K.TRACK} ms.`]
    };
  },
  lookbook(st, K, I) {
    const N = st.items.length, k = st.copy;
    return {
      one: `Lookbook plein écran de ${N} images qui se succèdent par volet, avec un titre qui monte lettre par lettre.`,
      idea: `La page tient dans un seul écran. À gauche, un panneau de texte donne l'indice de l'image, une surligne, le nom du look en très grand, une description et une ligne de méta ; en bas, deux flèches encadrent une barre de progression. À droite, l'image occupe toute la hauteur jusqu'au bord de la fenêtre. Toutes les ${K.AUTO} ms, l'image suivante entre par un volet venu de la droite pendant que l'ancienne recule, et le titre se recompose lettre par lettre.${I.drag ? " Un glissement horizontal change d'image." : ""}`,
      layout: [
        `Panneau de texte : left 0, top 0, largeur 560, pleine hauteur, marges intérieures 150 (haut), 60 (côtés), 90 (bas), colonne.`,
        `Indice « 01 / ${String(N).padStart(2, "0")} » : 13 px, interlettrage 0.1em, chiffres tabulaires, --text-2. Surligne ${q(k.title)} : 26 px dessous ; 12 px ; interlettrage 0.1em ; capitales ; --accent.`,
        `Nom h2 : 12 px dessous ; police titre ; 84 px ; interligne 0.98 ; interlettrage -0.02em ; overflow hidden pour masquer les lettres avant leur entrée. Description : 22 px dessous ; 17 px ; interligne 1.5 ; --text-2 ; largeur max 400. Méta : 14 px dessous ; 14 px.`,
        `Commandes : collées en bas du panneau, écart 14 : flèche gauche, barre de 2 px (fond --line, remplissage --text) qui prend la place restante, flèche droite. Flèches : cercles de 46 px, bord 1 px --line.`,
        `Image : de left 560 jusqu'au bord droit de la fenêtre, pleine hauteur, background-size: cover, centrée. Deux calques : l'image courante et l'image entrante.`,
        `Exception au chrome : la navigation et le pied passent au dessus de l'image. Ils sont en #FFFFFF avec mix-blend-mode: difference, pour rester lisibles sur l'image comme sur le panneau.`
      ],
      engine: [
        `Changement vers la droite (image suivante) : le calque entrant part de clip-path: inset(0 0 0 100%) et arrive à inset(0 0 0 0) en ${K.WIPE} ms, cubic-bezier(.77, 0, .18, 1). En même temps, le calque courant va à translateX(-${K.PUSH}%) scale(${K.ZOOM}), même durée, même courbe.`,
        `Vers la gauche (image précédente) : départ à inset(0 100% 0 0), et le calque courant va à translateX(${K.PUSH}%) scale(${K.ZOOM}).`,
        `À la fin : le calque courant prend l'image entrante sans transformation, le calque entrant retourne à inset(0 0 0 100%) sans transition.`,
        `Titre : chaque lettre du nom est un span inline-block, aria-hidden, le h2 portant le nom en aria-label. À chaque changement, les lettres partent de translateY(110%) et arrivent à 0 en ${K.LET} ms, cubic-bezier(.22, 1, .36, 1), avec un retard de j × ${K.STAG} ms pour la lettre j.`,
        `Lecture automatique : la barre se remplit de 0 à 100 % en ${K.AUTO} ms, linéaire ; à 100 %, image suivante et remise à 0.${I.hover ? " Le survol de l'image met la barre en pause." : ""}`,
        I.drag ? `Glissement : entre pointerdown et pointerup sur l'image, si |dx| > ${K.SWIPE} px, image suivante (vers la gauche) ou précédente (vers la droite).` : null,
        `Molette : un cran de plus de 20 px change d'image, une seule fois par période de ${K.WIPE} ms.`
      ],
      states: [
        `Pendant un volet, les nouvelles commandes sont ignorées.`,
        `Clavier : flèche droite, image suivante ; flèche gauche, image précédente. Les flèches à l'écran font de même et portent un aria-label.`,
        `Accessibilité : la zone d'image porte role="group", aria-roledescription="carrousel" ; l'indice est en aria-live="polite". Focus visible : contour 2 px --accent décalé de 3 px.`
      ],
      entrance: [`0 ms : bande haute et pied en fondu en 600 ms.`, `0 ms : la zone d'image s'ouvre par le même volet, de inset(0 0 0 100%) à inset(0 0 0 0) en ${K.WIPE} ms.`, `0 ms : les lettres du premier nom montent avec leur décalage de ${K.STAG} ms.`],
      mobile: [`Portrait, cadre 390 par 844 : image en haut, pleine largeur, top 56, hauteur 420 ; panneau dessous, top 476, hauteur 330, marges 22 (haut), 20 (côtés), 8 (bas) ; nom 40 px ; description 14 px.`, `Paysage mobile : mêmes valeurs que le bureau, réduites par l'unité scène.`],
      reduced: [`Coupé : lecture automatique, volet (l'image change d'un coup), montée des lettres, entrée.`, `Conservé : flèches, clavier, glissement, molette.`],
      checks: [`Un volet dure ${K.WIPE} ms et l'ancienne image recule de ${K.PUSH} % en grossissant à ${K.ZOOM}.`, `Sans interaction, l'image change toutes les ${K.AUTO} ms.`, `La dernière lettre d'un nom de 10 lettres commence à monter ${9 * K.STAG} ms après la première.`, `Après ${N} avancées, la première image est de retour.`]
    };
  },
  boutique(st, K, I) {
    const N = st.items.length, k = st.copy;
    return {
      one: `Boutique virtuelle en trois colonnes : catalogue de ${N} pièces à gauche, pièce en vedette au centre, panier à droite.`,
      idea: `La page tient dans un seul écran. À gauche, le catalogue liste les pièces avec une vignette${I.search ? ", sous un champ de recherche" : ""}${I.filters ? " et des filtres par catégorie" : ""}. Au centre, la pièce choisie flotte lentement${I.hover ? " et s'incline vers le pointeur" : ""} ; son nom, sa description, son prix${I.swatches ? " et ses pastilles de couleur" : ""} sont dessous. Choisir une autre pièce fait sortir la vedette vers le bas et entrer la nouvelle par le haut. À droite, le récapitulatif liste les lignes du panier et un total qui compte jusqu'à sa nouvelle valeur.`,
      layout: [
        `Catalogue : left 40, top 104, largeur 300, jusqu'à bottom 64, défilement interne, écart 12. Titre h2 ${q(k.shopTitle)} (police titre, 28 px).${I.search ? ` Recherche ${q(k.search)} : hauteur 38, filet bas 1 px --line, 13 px.` : ""}${I.filters ? ` Filtres : puces de hauteur 36, marge intérieure horizontale 16, rayon 99, bord 1 px --line, 12 px, graisse 500, capitales ; première puce ${q(k.filterAll)} ; active : fond --text, texte --bg.` : ""}`,
        `Ligne du catalogue : bouton pleine largeur, marge intérieure 6, rayon 8, grille vignette de 54 px (recadrée dans la feuille de sprites), nom (14 px), prix (13 px, --text-2). Ligne active : bord 1 px --text, fond --ghost, aria-current="true".`,
        `Vedette : colonne left 380, top 96, largeur 660, centrée, perspective 1200. Visuel carré de 430 px. Dessous, écart 10, centrés : nom h1 (police titre, 46 px, interligne 1, interlettrage -0.02em), description (15 px, --text-2, largeur max 440), prix (18 px, graisse 600)${I.swatches ? ", pastilles rondes de 28 px (écart 10, bord 1 px --line, anneau 1.5 px --text sur l'active)" : ""}.`,
        `Récapitulatif : left 1080, top 104, largeur 320, écart 14. Titre h2 ${q(k.recapTitle)} (police titre, 28 px). Lignes : nom, quantité au format « x 1 » (--text-2), prix ; 14 px ; filet haut 1 px --line ; hauteur min 120${I.cart ? ` ; panier vide : ${q(k.empty)} (13 px, --text-2)` : ""}. Total ${q(k.total)} : 15 px, graisse 600, chiffres tabulaires, filet haut.${I.cart ? ` Bouton ${q(k.cta)} : hauteur 52, marge intérieure horizontale 28, fond --text, texte --bg, 13 px, graisse 600, interlettrage 0.08em, capitales.` : ""}`
      ],
      engine: [
        `Flottement de la vedette : translateY(${K.FLOAT} × sin(t × ${K.FLOATF}) px), t en secondes, en unité scène.`,
        I.hover ? `Inclinaison : mx et my sont la position du pointeur dans la colonne centrale, de 0 à 1 (0.5 hors de la colonne). Cibles : rotateY = (mx - 0.5) × ${K.TILTY} degrés ; rotateX = -(my - 0.5) × ${K.TILTX} degrés. À chaque image, valeur += (cible - valeur) × (1 - ${K.DAMP}^(dt × 60)).` : null,
        `Changement de pièce : le visuel et le bloc de texte passent à l'opacité 0 et translateY(20px) en ${K.OUT} ms, ease-in ; le contenu change ; ils reviennent depuis translateY(-20px) et l'opacité 0 en ${K.IN} ms, cubic-bezier(.22, 1, .36, 1).`,
        I.swatches ? `Pastilles : changement immédiat de background-position du visuel vers la ligne du coloris.` : null,
        I.cart ? `Bouton d'achat : ajoute la pièce en vedette au panier, ou augmente sa quantité de 1. Le total rejoint sa nouvelle valeur en ${K.COUNT} ms, easeOutCubic, arrondi à l'unité pendant le comptage. Le badge du panier affiche la quantité totale et rebondit, scale 1, 1.25, 1 en 260 ms.` : null,
        I.search || I.filters ? `Recherche et filtres : une ligne qui réapparaît passe de l'opacité 0 à 1 en ${K.FLIP} ms ; une ligne exclue est retirée sans animation.` : null
      ],
      states: [
        `État initial : première pièce en vedette, panier vide, total à 0.`,
        `Clavier : les lignes du catalogue, les pastilles et le bouton sont des boutons atteignables à la tabulation.`,
        `Accessibilité : les trois colonnes sont des section avec aria-label ; la colonne centrale est en aria-live="polite"${I.swatches ? ' ; les pastilles forment un role="radiogroup" avec aria-checked' : ""}. Focus visible : contour 2 px --accent décalé de 3 px.`,
        I.search ? `Recherche : filtre à la frappe sur le nom, sans tenir compte de la casse.` : null
      ],
      entrance: [`0 ms : bande haute et pied en fondu en 600 ms ; la vedette passe de scale(.8) et de l'opacité 0 à scale(1) et 1 en 700 ms, cubic-bezier(.22, 1, .36, 1).`, `150 ms + i × 50 ms : chaque ligne du catalogue glisse de 16 px depuis la gauche et passe de l'opacité 0 à 1 en 450 ms.`],
      mobile: [`Portrait, cadre 390 par 844 : vedette en haut (top 60, hauteur 400, visuel 230 px, nom 26 px, description masquée) ; catalogue dessous (left 16, top 470, largeur 358, hauteur 190, titre masqué) ; récapitulatif réduit au total et au bouton (left 16, top 672, largeur 358, bouton hauteur 42).`, `Paysage mobile : mêmes valeurs que le bureau, réduites par l'unité scène.`],
      reduced: [`Coupé : flottement, lissage de l'inclinaison, transitions de changement de pièce, comptage du total, entrée.`, `Conservé : sélection, recherche, filtres, panier.`],
      checks: [`La vedette oscille de ${K.FLOAT} px de part et d'autre de sa position, période ${(Math.PI * 2 / K.FLOATF).toFixed(2)} s.`, I.hover ? `Pointeur dans un coin de la colonne centrale : inclinaison de ${K.TILTY / 2} degrés en Y et ${K.TILTX / 2} degrés en X.` : null, `Changer de pièce prend ${K.OUT} ms de sortie puis ${K.IN} ms d'entrée.`, I.cart ? `Ajouter deux fois la même pièce donne une seule ligne « x 2 » et un total doublé.` : null, `Un seul fichier d'image est chargé : la feuille de sprites.`]
    };
  }
};

function buildPrompt(st, res) {
  const A = ARCH[st.arch], K = A.K, I = eff(st), a = st.assets, U = assetURLs(st), k = st.copy, t = st.tokens;
  const S = SPEC[st.arch](st, K, I), brand = clean(st.brand.name || "Marque");
  const wd = Math.max(...(st.fonts.display.weights.length ? st.fonts.display.weights : [700]));
  const bw = n => nearW(st.fonts.body.weights, n);
  const L = [], sec = n => L.push("", "## " + n + ". " + SECTIONS[n - 1], "");
  const list = arr => arr.filter(Boolean).forEach(x => L.push("- " + x));

  L.push("# " + brand + " : " + A.name.toLowerCase());
  L.push("", "Construis cette page dans un seul fichier HTML, CSS et JavaScript en ligne, sans framework ni étape de build. " + brand + " est une marque fictive : n'utilise aucun nom de marque réel. Ne génère et n'invente aucune image : seuls les assets de la section 3 existent.");

  sec(1);
  L.push("**" + brand + ", " + clean(k.title || A.name) + ".** " + S.one);
  L.push("", "Secteur : " + clean(st.brand.sector) + ". Ton : " + clean(st.brand.tone) + ". Public : " + clean(st.brand.audience) + ".");

  sec(2); L.push(clean(S.idea));

  sec(3);
  L.push("Règle : chaque URL est écrite une seule fois, dans une variable CSS sur :root ou une constante JS, puis réutilisée partout.", "");
  if (A.assets === "sprite") {
    const sp = a.sprite, cw = Math.round(sp.w / sp.cols), ch = Math.round(sp.h / sp.rows);
    list([
      `Feuille de sprites unique : :root { --sprite: url("${U.sprite}"); }`,
      `Dimensions : ${sp.w} par ${sp.h} px ; grille de ${sp.cols} colonnes par ${sp.rows} lignes ; cellules carrées de ${cw} px${cw !== ch ? " (attention, cellules de " + cw + " par " + ch + " px)" : ""} ; fond transparent. Produits en colonnes, coloris en lignes.`,
      `Recadrage CSS de chaque visuel : background-image: var(--sprite); background-repeat: no-repeat; background-size: ${sp.cols * 100}% ${sp.rows * 100}%; background-position: X% Y%.`,
      `Formules, colonnes et lignes comptées à partir de 0 : X = colonne / (${sp.cols} - 1) × 100 ; Y = ligne / (${sp.rows} - 1) × 100.`,
      `Nettoyage de l'alpha : place une fois ce SVG dans le body, puis applique filter: url(#alpha-clean) à chaque calque détouré : \`${FILTER_SVG}\``
    ]);
    L.push("", "Correspondance des cellules :", "", "| Produit | Coloris | Colonne | Ligne | background-position |", "|---|---|---|---|---|");
    st.items.forEach(it => it.colors.forEach(c => L.push(`| ${clean(it.name)} | ${clean(c.name)} | ${c.col} | ${c.row} | ${cellPos(sp, c)} |`)));
    if (!I.swatches) L.push("", "Seul le premier coloris de chaque produit est affiché.");
  } else if (A.assets === "variants") {
    list([
      `9 photos alignées au pixel près, toutes de ${a.vw} par ${a.vh} px, même cadrage, fond transparent. Chaque variante ne diffère de la base que par une seule pièce.`,
      `Repères notés sur les photos : haut de la tête à ${a.head} % de la hauteur, pieds à ${a.feet} %.`,
      `8 masques doux, un par variante : PNG RGBA où l'alpha est le poids de la zone remplacée, bords adoucis par un flou de ${a.blur} px à l'échelle de la photo. Ils sont fournis en data URI dans l'annexe et étirés à la taille des photos au dessin.`,
      `Ordre de mélange : chaussures, jupe, haut, sac.`,
      `Nettoyage de l'alpha : place une fois ce SVG dans le body, puis applique filter: url(#alpha-clean) aux deux canvas du mannequin : \`${FILTER_SVG}\``,
      I.ar ? `Photo de fond du mode AR : "${U.ar}".` : null
    ]);
    L.push("", "Constante JS, déclarée une seule fois :", "", "| Indice | Zone | Pièce | URL |", "|---|---|---|---|");
    L.push(`| 0 | base | tenue de base | ${U.variants[0]} |`);
    st.tryon.slots.forEach((sl, si) => [1, 2].forEach(v => L.push(`| ${1 + si * 2 + v - 1} | ${clean(sl.label)} | ${clean(sl.opts[v].name)} | ${U.variants[1 + si * 2 + v - 1]} |`)));
  } else {
    list([
      `${st.items.length} images de ${a.iw} par ${a.ih} px, une par entrée, affichées en background-size: cover, centrées.`,
      `Constante JS, déclarée une seule fois, dans l'ordre des entrées.`
    ]);
    L.push("", "| Indice | Entrée | URL |", "|---|---|---|");
    st.items.forEach((it, i) => L.push(`| ${i} | ${clean(it.name)} | ${U.images[i]} |`));
  }

  sec(4);
  const fd = st.fonts.display, fb = st.fonts.body;
  list([
    `Google Fonts, une seule balise link : ${fontsURL(st.fonts)}`,
    `Police titre : "${fd.family}", graisses chargées ${fd.weights.join(", ")} ; les titres utilisent la graisse ${wd}. Pile de secours : ${fontStack(fd.family)}.`,
    `Police texte : "${fb.family}", graisses chargées ${fb.weights.join(", ")} ; texte courant en ${bw(400)}, libellés en ${bw(500)}, boutons et badges en ${bw(600)}. Pile de secours : ${fontStack(fb.family)}.`,
    fd.family === fb.family ? `Une seule famille sert aux titres et au texte.` : null
  ]);

  sec(5);
  L.push("Variables CSS sur :root. Aucune autre couleur, sauf mention explicite dans le layout.", "", "| Variable | Valeur | Rôle |", "|---|---|---|");
  TOKENS.forEach(x => L.push(`| ${x.css} | ${t[x.k].toUpperCase()} | ${x.role} |`));

  sec(6);
  list([`html lang="fr"`, `title : ${clean(st.meta.title)}`, `meta description : ${clean(st.meta.desc)}`, `meta viewport : width=device-width, initial-scale=1, viewport-fit=cover`, `meta charset : utf-8`]);

  sec(7);
  list([
    `Cadre de design : 1440 par 900 px. Toutes les valeurs du layout sont en px de design.`,
    `Unité chrome, pour ce qui est collé aux bords de la fenêtre (logo, navigation, panier, pied) : --c: calc(100vw / 1440). Un élément à 40 du bord s'écrit left: calc(40 * var(--c)).`,
    `Unité scène, pour tout le reste : --s: min(calc(100vw / 1440), calc(100vh / 900)). La scène est un bloc de calc(1440 * var(--s)) par calc(900 * var(--s)), centré avec left: 50%; top: 50%; transform: translate(-50%, -50%). Son contenu se place en multiples de var(--s).`,
    `Planchers : tout texte de 16 px de design ou moins s'écrit font-size: max(9px, calc(N * var(--c))) dans le chrome et max(9px, calc(N * var(--s))) dans la scène. Les planchers plus hauts sont indiqués au cas par cas.`,
    `html et body : height 100 %, margin 0, overflow hidden. Aucune barre de défilement sur la page.`,
    `Le moteur lit s en px avec largeur de la scène / 1440.`
  ]);

  sec(8);
  L.push("Chrome, en unité --c :", "");
  list([
    `Logo ${q(brand)} : left 40, top 30 ; police titre ; graisse ${wd} ; 22 px, plancher 14 px ; interlettrage 0.02em ; capitales ; interligne 1.`,
    `Navigation : centrée horizontalement, top 36 ; liens ${[k.nav1, k.nav2, k.nav3].filter(Boolean).map(q).join(", ")} ; écart 36 ; police texte ; 12 px ; graisse ${bw(500)} ; interlettrage 0.08em ; capitales ; --text-2.`,
    I.cart ? `Panier : right 40, top 26 ; libellé ${q(k.cart)} en 12 px, graisse ${bw(500)}, interlettrage 0.08em, capitales ; à 10 de distance, badge rond de 24 de haut, fond --accent, texte --bg, 11 px, graisse ${bw(600)}, valeur initiale 0.` : null,
    `Pied : left 40, right 40, bottom 26 ; 11 px ; interlettrage 0.06em ; capitales ; --text-2 ; à gauche ${q(k.hint)}, à droite ${q(k.footer)}.`
  ]);
  L.push("", "Scène, en unité --s :", "");
  list(S.layout.map(clean));
  L.push("", "Textes exacts (liste fermée) :", "");
  textList(st).forEach(([l, v]) => L.push(`- ${l} : « ${v} »`));

  sec(9); list(S.engine.map(clean));
  L.push("", "Courbes nommées : easeOutCubic(t) = 1 - (1 - t)^3 ; easeInOutCubic(t) = 4t^3 si t < 0.5, sinon 1 - (-2t + 2)^3 / 2 ; lerp(a, b, t) = a + (b - a) × t. Boucle requestAnimationFrame unique.");

  sec(10); list(S.states.map(clean));
  const offs = INTER.filter(x => !I[x.k] && A.uses.includes(x.k) && !["reduced", "mobile"].includes(x.k)).map(x => x.l.toLowerCase());
  if (offs.length) L.push("- Hors périmètre, à ne pas construire : " + offs.join(", ") + ".");

  sec(11); list(S.entrance.map(clean));

  sec(12);
  if (I.mobile) {
    list([`Bascule : en orientation portrait, le cadre de design devient 390 par 844 : --c: calc(100vw / 390) ; --s: min(calc(100vw / 390), calc(100vh / 844)).`, `Portrait, chrome : navigation masquée ; logo left 20, top 22 ; panier right 20, top 18 ; pied left 20, bottom 16, la note de droite est masquée.`]);
    list(S.mobile.map(clean));
  } else L.push("- Hors périmètre : la page est conçue pour un écran de bureau. Sur un écran plus petit, la même mise en page est réduite par les deux unités, sans réorganisation.");

  sec(13);
  if (I.reduced) { L.push("Sous @media (prefers-reduced-motion: reduce), testé aussi en JS avec matchMedia :", ""); list(S.reduced.map(clean)); }
  else L.push("- Aucun traitement particulier : les animations sont identiques quel que soit le réglage du système.");

  sec(14);
  [...S.checks.filter(Boolean).map(clean),
    `Aucune barre de défilement à 1440 par 900, 1280 par 720 et 1920 par 1080.`,
    I.mobile ? `En 390 par 844, la mise en page portrait décrite en section 12 s'applique.` : null,
    I.reduced ? `Avec prefers-reduced-motion, plus aucun mouvement automatique.` : null,
    `Toutes les actions sont faisables au clavier, avec un focus visible.`,
    `La console du navigateur ne contient aucune erreur.`,
    `Chaque texte visible figure dans la liste fermée de la section 8.`
  ].filter(Boolean).forEach(x => L.push("- [ ] " + x));

  sec(15);
  if (st.arch === "tryon") {
    L.push("Points de style par pièce (indice 0 = pièce de base) et looks préconçus, à copier tels quels :", "", "```json");
    L.push(JSON.stringify({ zones: st.tryon.slots.map(sl => ({ zone: clean(sl.label), pieces: sl.opts.map(o => ({ nom: clean(o.name), prix: clean(o.price), points: +o.pts || 0, pastille: o.hex })) })), looks: st.tryon.looks.map(l => ({ nom: clean(l.name), tenue: l.pick })) }, null, 1));
    L.push("```", "", "Masques, dans l'ordre des indices 1 à 8 de la section 3, à copier tels quels :", "");
    (res.masks || []).forEach((m, i) => L.push("MASQUE_" + (i + 1) + " = " + m));
    if (!(res.masks || []).length) L.push("(Aucun masque fourni : ajoutez les à l'étape Assets.)");
  } else {
    L.push("Données de la page, à copier telles quelles :", "", "```json");
    const sp = a.sprite;
    L.push(JSON.stringify(st.items.map((it, i) => Object.assign({ nom: clean(it.name), categorie: clean(it.tag), prix: clean(it.price), description: clean(it.desc) }, A.assets === "sprite" ? { coloris: it.colors.map(c => ({ nom: clean(c.name), pastille: c.hex, position: cellPos(sp, c) })) } : { image: i })), null, 1));
    L.push("```");
  }
  L.push("", LAST_LINE);
  return L.join("\n");
}

/* ---------- validateur : lit le texte du prompt, pas l'état du formulaire ---------- */
const APPROX = /(^|[\s(«'"])(environ|approximativement|à peu près|a peu pres|autour de|quelques|plus ou moins|grosso modo|à la louche|about|roughly|approximately)(?=[\s,.;:)»]|$)|[~≈]/gi;
function parsePrompt(txt) {
  const lines = txt.split("\n"), secs = {}; let cur = 0;
  lines.forEach((l, i) => { const m = /^##\s+(\d{1,2})\.\s+(.*)$/.exec(l); if (m) { cur = +m[1]; secs[cur] = { title: m[2].trim(), line: i + 1, body: [] }; } else if (cur) secs[cur].body.push(l); });
  return { lines, secs };
}
function validatePrompt(txt, st) {
  const out = [], add = (lvl, title, detail) => out.push({ lvl, title, detail });
  const { lines, secs } = parsePrompt(txt);
  const present = SECTIONS.map((_, i) => !!secs[i + 1]);
  // 1. sections
  SECTIONS.forEach((name, i) => {
    const s = secs[i + 1];
    if (!s) add("err", "Section manquante : " + (i + 1) + ". " + name, "Le format impose 15 sections, dans l'ordre.");
    else if (!s.body.join("").trim()) add("err", "Section vide : " + (i + 1) + ". " + name, "Ligne " + s.line + ".");
    else if (s.title.toLowerCase() !== name.toLowerCase()) add("warn", "Titre de section inattendu en " + (i + 1), "Attendu « " + name + " », trouvé « " + s.title + " ».");
  });
  const order = Object.values(secs).map(s => s.line); if (order.some((l, i) => i && l < order[i - 1])) add("err", "Sections dans le désordre", "Remettez les dans l'ordre de 1 à 15.");
  // 2. valeurs approximatives
  lines.forEach((l, i) => { if (/^MASQUE_\d/.test(l)) return; const m = l.match(APPROX); if (m) add("err", "Valeur approximative : « " + m[0].trim() + " »", "Ligne " + (i + 1) + ". Donnez la valeur exacte : " + l.trim().slice(0, 110)); });
  // 3. tirets interdits
  lines.forEach((l, i) => { if (/[\u2012-\u2015]/.test(l)) add("err", "Tiret cadratin ou demi cadratin", "Ligne " + (i + 1) + " : " + l.trim().slice(0, 110)); });
  // 4. URL
  if (secs[3]) {
    const body = secs[3].body.join("\n"), urls = body.match(/https?:\/\/[^\s"')|`]+/g) || [], rel = body.match(/(?:^|[\s"(|])assets\/[^\s"')|`]+/g) || [];
    const imgs = urls.filter(x => !/fonts\.googleapis|w3\.org/.test(x));
    if (!imgs.length && !rel.length && !/data:image/.test(body)) add("err", "URL absente", "La section 3 ne contient aucune URL d'image.");
    if (rel.length) add("err", "URL absente : " + rel.length + " chemin(s) de remplacement", rel.map(r => r.trim().replace(/^[|("]\s*/, "")).join(", ") + ". Hébergez ces fichiers et collez leurs URL complètes à l'étape Assets.");
    imgs.filter(x => /\.example(\/|$)/.test(x)).slice(0, 1).forEach(x => add("warn", "URL d'exemple", "Les URL en .example ne chargent rien (" + imgs.filter(y => /\.example(\/|$)/.test(y)).length + " dans le prompt). Remplacez les par vos URL hébergées ; l'aperçu utilise des visuels de remplacement."));
    if (st && ARCH[st.arch].assets === "variants") { const n = (txt.match(/^MASQUE_\d+ = data:image\/png/gm) || []).length; if (n < 8) add("err", "Masques manquants", n + " masque(s) en data URI dans l'annexe, 8 attendus."); }
  }
  // 5. contraste entre tokens
  if (secs[5]) {
    const tok = {}; secs[5].body.forEach(l => { const m = /(--[a-z0-9-]+)\s*\|\s*(#[0-9a-f]{6})\b/i.exec(l); if (m) tok[m[1]] = m[2]; });
    const need = TOKENS.filter(x => !tok[x.css]); if (need.length) add("err", "Token de couleur manquant", need.map(x => x.css).join(", "));
    CONTRAST_RULES.forEach(r => { const A = tok[TOKENS.find(x => x.k === r.a).css], B = tok[TOKENS.find(x => x.k === r.b).css]; if (!A || !B || r.a === "bg") return; const c = contrast(A, B); if (c < r.min) add(r.min >= 3 ? "err" : "warn", "Contraste insuffisant : " + r.l, A.toUpperCase() + " sur " + B.toUpperCase() + " donne " + c.toFixed(2) + ", minimum " + r.min + "."); });
  }
  // 6. textes non listés
  if (secs[8]) {
    const body = secs[8].body, at = body.findIndex(l => /Textes exacts/i.test(l));
    const norm = s => s.toLowerCase().replace(/\s+/g, " ").trim();
    const listed = new Set(); if (at >= 0) body.slice(at).forEach(l => { const m = /^- .*?: « (.*) »\s*$/.exec(l); if (m) listed.add(norm(m[1])); });
    if (at < 0 || !listed.size) add("err", "Liste fermée des textes absente", "La section 8 doit se terminer par « Textes exacts (liste fermée) ».");
    else {
      const seen = new Set();
      lines.forEach((l, i) => { if (i + 1 >= secs[8].line + at + 1 && /^- .*?: « /.test(l)) return; (l.match(/« ([^»]+) »/g) || []).forEach(m => { const v = norm(m.slice(2, -2)); if (listed.has(v) || seen.has(v) || /^(nom, prix|\d\d \/ \d\d|x \d|00:00:00:00|01)$/.test(v) || /^nom, prix$/.test(v)) return; seen.add(v); add("err", "Texte non listé : « " + m.slice(2, -2) + " »", "Ligne " + (i + 1) + ". Ce texte est cité dans le prompt sans figurer dans la liste fermée de la section 8."); }); });
      if (st) textList(st).forEach(([l, v]) => { if (!listed.has(norm(v))) add("warn", "Texte du formulaire absent du prompt : « " + v + " »", l + ". Il a été retiré à la main ou le prompt n'est plus à jour."); });
    }
  }
  // 7. marque réelle, phrase finale
  const rb = realBrandIn(txt.replace(/^MASQUE_.*$/gm, "")); if (rb) add("err", "Nom de marque réel détecté : " + rb, "Le prompt ne doit citer aucune marque existante.");
  if (!txt.trim().endsWith(LAST_LINE)) add("err", "Phrase finale absente", "Le prompt doit se terminer par : " + LAST_LINE);
  if (secs[14] && !secs[14].body.some(l => /^- \[ \]/.test(l))) add("warn", "Checklist sans cases", "La section 14 doit contenir des cases à cocher « - [ ] ».");
  return { issues: out, present, count: present.filter(Boolean).length };
}
