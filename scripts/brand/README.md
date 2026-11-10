# Logo CampusFlow

Fichiers prêts à l'emploi dans `public/brand/` :

| Fichier         | Usage                                                               |
| --------------- | ------------------------------------------------------------------- |
| `logo.svg`      | Logo complet sur fond clair (pictogramme + « CampusFlow »)          |
| `logo-dark.svg` | Logo complet sur fond sombre                                        |
| `logo-mark.svg` | Pictogramme seul (réseaux sociaux, avatar)                          |
| `app-icon.svg`  | Icône d'app pleine page ; `icon-192.png` et `icon-512.png` pour PWA |

Icônes du site : `src/app/icon.svg` (onglet), `src/app/favicon.ico`, `src/app/apple-icon.png`.

Couleurs : jaune `#FFD23F`, encre `#111111`, bleu `#5B8CFF`, fond `#F6F4EC`.
Police du mot-symbole : Bricolage Grotesque ExtraBold, lettres resserrées de 3 %.

## Régénérer

```bash
pip install fonttools brotli
npm pack @fontsource/bricolage-grotesque && tar -xzf fontsource-bricolage-grotesque-*.tgz
python3 scripts/brand/build_logo.py package/files/bricolage-grotesque-latin-800-normal.woff2 public/brand
```

Le script convertit le texte en tracés : les SVG s'affichent à l'identique sans la police.
