# Atelier Motion Site

Générateur de prompts et de pages hero animées ("motion site"), en un seul fichier HTML, sans framework ni étape de compilation.

On décrit une marque fictive et ses visuels en six étapes. L'outil produit un prompt complet de 15 sections, à coller dans n'importe quelle IA de code, le relit avec un validateur, et affiche un aperçu vivant de la page.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page autonome, à ouvrir directement dans un navigateur. |
| `atelier-motion-site.html` | Même page sans doctype ni balises `head` et `body`, au format attendu par un artefact claude.ai. |
| `src/` | Sources, assemblées dans l'ordre de leur numéro. |
| `build.sh` | Assemble `src/` et régénère les deux fichiers ci dessus. |

Sources :

1. `01-head.html` : titre, polices, styles de l'outil.
2. `02-body.html` : structure de la page.
3. `03-core.js` : utilitaires, archétypes et leurs constantes, gabarits BUNTO et Maison Edit, visuels de remplacement dessinés au canvas.
4. `04-demos.js` : les sept moteurs de démonstration et l'export autonome.
5. `05-prompt.js` : générateur de prompt et validateur.
6. `06-app.js` : formulaire, assets, aperçu, appel à Claude, copie et téléchargement.

## Reconstruire

```bash
./build.sh
```

Le script demande Node, uniquement pour vérifier la syntaxe des fichiers JavaScript.

## Ce qui dépend de l'hébergement

Ouvert comme simple fichier, l'outil génère le prompt, le valide et joue le gabarit de démonstration. Deux fonctions ne s'allument que dans un artefact claude.ai :

- la génération de la page par Claude à partir du prompt ;
- l'enregistrement de fichiers par la boîte de dialogue de l'hôte. Hors artefact, un téléchargement classique prend le relais.

## Limites connues

- Les visuels des gabarits sont des remplacements dessinés par l'outil. Le réalisme d'une page de ce type vient des photos fournies : téléversez les vôtres à l'étape Assets.
- Les URL des gabarits sont fictives (domaine `.example`) et le validateur le signale.
- Le téléversement d'images et le calcul des masques par différence n'ont pas été testés avec de vraies photos.
