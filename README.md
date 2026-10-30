# Inventaire du Groupe — OSR (OSE / AD&D 1E)

Site statique de suivi d'inventaires pour parties de RPG Old-School :
charge et encombrement par paliers, classe d'armure, monnaie, coffre de groupe,
export/import JSON. Aucun serveur, aucune dépendance.

> Inspiré de « The Sieve » de Beau Rancourt (https://rancourt.substack.com/p/the-sieve).

## 📁 Structure du projet

```
inventaire-rpg/
├── index.html        Page web (structure uniquement)
├── css/
│   └── style.css     Tout le style (ambiance parchemin sombre)
└── js/
    ├── config.js     ← LES RÈGLES DU JEU : c'est LE fichier à éditer
    ├── data.js       Inventaires de départ (utilisés seulement au 1er lancement)
    └── app.js        Logique de l'application (ne touche pas en général)
```

Les scripts sont volontairement des scripts classiques (pas de modules) :
le site fonctionne aussi en ouvrant `index.html` par double-clic, sans serveur.

## ⚙️ Adapter le site à ta table : `js/config.js`

Tout est paramétrable dans ce fichier unique, section par section :

| Section | Contenu | Source CSV |
|---|---|---|
| `CONTAINER_TYPES` | Conteneurs : poids à vide (∅), capacité | conteneurs.csv |
| `ARMORS` | Armures et boucliers : poids, CA | armures.csv |
| `WEAPONS` | Armes : poids | armes.csv |
| `GEAR` | Équipement d'aventurier : poids | equipement.csv |
| `CURRENCIES` | Monnaies : abréviation, poids/pièce | — |
| `STRENGTH_TABLE` | Force → charge permise (avec 18/xx exceptionnels) | force.csv |
| `DEX_TABLE` | Dextérité → ajustement de CA | dexterite.csv |
| `ENC_CATEGORIES` | Paliers d'encombrement : seuils, mouvement, malus | enc_cat.csv |
| `BASE_MOVES` | Mouvements de base autorisés (12, 9, 6, 3) | — |
| `CATALOGS` | Catalogues du formulaire d'ajout d'objet | — |

### Règles de jeu implémentées

- **Charge permise** : issue du score de Force (`STRENGTH_TABLE`).
- **Encombrement** : 5 catégories par paliers de +35 liv au-delà de la charge
  permise (`ENC_CATEGORIES`). Au-delà de +140 liv : immobilisé. Le mouvement
  effectif et le malus d'attaque se recalculent en direct.
- **CA** (convention AD&D 1E, plus basse = meilleure) : CA de l'armure portée
  (ou 10) − ajustement de Dextérité + modificateur de bouclier (−1).
  ⚠️ L'armure et le bouclier sont déduits des objets de la section
  « Porté sur soi » : le nom de l'objet doit correspondre **exactement** à un
  nom de `ARMORS` pour être reconnu.
- **Monnaie** : ligne dédiée dans chaque conteneur, poids calculé depuis
  `CURRENCIES` (50 pièces ≈ 1 livre). La capacité d'un conteneur mesure les
  objets uniquement.
- **Coffre de groupe** : créer un personnage dont le nom contient « coffre »,
  « trésor » ou « butin » en crée un automatiquement.

### Données et sauvegarde

- Sauvegarde automatique dans le navigateur (localStorage).
- Menu **☰ → Exporter** : JSON complet de la party (téléchargement ou copie).
- Menu **☰ → Importer** : restaure un export (avec confirmation) ; les données
  incompletes sont normalisées automatiquement à l'import.
- ⚠️ La sauvegarde est propre à chaque navigateur/appareil : pense à exporter
  en fin de séance.

## 🌐 Mise en ligne (GitHub Pages)

1. Crée un dépôt sur https://github.com (nom suggéré : `inventaire-rpg`).
2. Dépose-y le contenu de ce dossier (`index.html`, `css/`, `js/`, `README.md`)
   — via l'interface web (« Add file → Upload files ») ou en ligne de commande :
   ```bash
   git init
   git add .
   git commit -m "Inventaire RPG"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/inventaire-rpg.git
   git push -u origin main
   ```
3. Dans le dépôt : **Settings → Pages → Branch: main → Save**.
4. Après quelques minutes, le site est en ligne sur
   `https://<ton-compte>.github.io/inventaire-rpg/`.

Alternatives sans compte Git : [Netlify Drop](https://app.netlify.com/drop)
(glisser-déposer le dossier) ou [Vercel](https://vercel.com).

## 🛠️ Développement local

Double-clique sur `index.html` — rien d'autre à installer. Toute modification
de `js/config.js` est immédiatement prise en compte en rechargeant la page
(F5). ⚠️ Si tu changes les données de `js/data.js` alors qu'une sauvegarde
existe déjà dans ton navigateur, exporte-la, vide la sauvegarde locale, puis
réimporte-la : les données sauvegardées priment toujours sur `data.js`.
