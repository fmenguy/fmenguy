#!/bin/bash
# Assemble les sources en un seul fichier HTML, sans dépendance ni étape de compilation.
set -e
cd "$(dirname "$0")"
for f in src/03-core.js src/04-demos.js src/05-prompt.js src/06-app.js; do node --check "$f"; done
# 1. Corps de page pour un artefact claude.ai (l'hôte ajoute lui même doctype, head et body).
{ cat src/01-head.html src/02-body.html; echo '<script>'; cat src/03-core.js src/04-demos.js src/05-prompt.js src/06-app.js; echo '</script>'; } > atelier-motion-site.html
# 2. Page autonome, à ouvrir directement dans un navigateur.
{ echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'; cat atelier-motion-site.html; echo '</body></html>'; } > index.html
wc -c atelier-motion-site.html index.html
