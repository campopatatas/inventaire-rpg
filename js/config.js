/* ============================================================================
   CONFIGURATION DU JEU — Inventaire RPG (OSE / AD&D 1E)
   ----------------------------------------------------------------------------
   C'est LE fichier à éditer pour adapter le site à ta table.
   Chaque tableau ci-dessous correspond à un fichier source (CSV) fourni
   par Jocelyn. Les poids sont en livres (1 liv ≈ 0,5 kg).
   ============================================================================ */

// ── Conteneurs ──────────────────────────────────────────────────────────────
//   name  : nom affiché — selfW : poids du conteneur vide (liv)
//   cap   : capacité de contenu (liv, la monnaie n'y compte pas)
// Source : conteneurs.csv
const CONTAINER_TYPES = [
  { name: "Sac à dos", selfW: 2, cap: 50 },
  { name: "Panier, grand", selfW: 4, cap: 20 },
  { name: "Panier, petit", selfW: 2, cap: 10 },
  { name: "Bourse de ceinture, grande", selfW: 1, cap: 8 },
  { name: "Bourse de ceinture, petite", selfW: 0.5, cap: 5 },
  { name: "Coffre, grand", selfW: 25, cap: 100 },
  { name: "Coffre, petit", selfW: 10, cap: 40 },
  { name: "Sac, grand", selfW: 0.2, cap: 60 },
  { name: "Sac, petit", selfW: 0.1, cap: 20 },
  { name: "Sacoches de selle, grandes", selfW: 30, cap: 30 },
  { name: "Sacoches de selle, petites", selfW: 20, cap: 20 }
];

// ── Armures et boucliers ────────────────────────────────────────────────────
//   name : nom affiché — w : poids unitaire (liv)
//   ca   : CA en convention AD&D 1E (PLUS BASSE = meilleure)
//          Armures : ca absolu (ex. cotte de mailles = CA 5)
//          Boucliers : ca négatif = modificateur appliqué à la CA (−1)
// Source : armures.csv
// ⚠️ La CA d'un personnage est déduite des objets « Porté sur soi » : le nom
//    de l'objet doit correspondre EXACTEMENT au nom ci-dessous pour être reconnu.
const ARMORS = [
  { name: "Armure feuilletée", w: 35, ca: 4 },
  { name: "Brigandine", w: 35, ca: 6 },
  { name: "Cotte de mailles", w: 40, ca: 5 },
  { name: "Cotte de mailles elfique", w: 15, ca: 5 },
  { name: "Harnois de campagne", w: 60, ca: 2 },
  { name: "Harnois plein", w: 75, ca: 1 },
  { name: "Armure de peau", w: 30, ca: 6 },
  { name: "Armure de cuir", w: 20, ca: 7 },
  { name: "Armure matelassée", w: 10, ca: 8 },
  { name: "Armure de plates", w: 50, ca: 3 },
  { name: "Armure annelée", w: 30, ca: 7 },
  { name: "Armure d'écailles", w: 40, ca: 6 },
  { name: "Armure à plaques", w: 40, ca: 4 },
  { name: "Bouclier, petit", w: 5, ca: -1 },
  { name: "Bouclier, standard", w: 10, ca: -1 }
];

// ── Armes ───────────────────────────────────────────────────────────────────
//   name : nom affiché — w : poids unitaire (liv)
// Source : armes.csv
const WEAPONS = [
  { name: "Arbalète légère", w: 7 },
  { name: "Arbalète lourde", w: 14 },
  { name: "Arc composite court", w: 5 },
  { name: "Arc composite long", w: 8 },
  { name: "Arc court", w: 2 },
  { name: "Arc long", w: 3 },
  { name: "Bardiche", w: 12.5 },
  { name: "Bâton", w: 4 },
  { name: "Bec de corbin", w: 10 },
  { name: "Bill-guisarme", w: 15 },
  { name: "Ceste", w: 2 },
  { name: "Cimeterre", w: 4 },
  { name: "Dague / Couteau", w: 1 },
  { name: "Épée à deux mains", w: 15 },
  { name: "Épée bâtarde", w: 10 },
  { name: "Épée courte", w: 3 },
  { name: "Épée large", w: 7.5 },
  { name: "Épée longue", w: 6 },
  { name: "Fléau de cavalier / léger", w: 5 },
  { name: "Fléau de fantassin / lourd", w: 15 },
  { name: "Fléchette", w: 0.5 },
  { name: "Fourche de guerre", w: 7 },
  { name: "Fronde", w: 2 },
  { name: "Glaive", w: 8 },
  { name: "Glaive-guisarme", w: 10 },
  { name: "Gourdin", w: 5 },
  { name: "Guisarme", w: 8 },
  { name: "Guisarme-vouge", w: 15 },
  { name: "Hache à deux mains", w: 10 },
  { name: "Hache de bataille", w: 7 },
  { name: "Hachette / Hache de lancer", w: 5 },
  { name: "Hallebarde", w: 12 },
  { name: "Javelot", w: 2 },
  { name: "Lance / Épieu", w: 5 },
  { name: "Lance de cavalerie", w: 15 },
  { name: "Marteau de guerre", w: 3 },
  { name: "Marteau de Lucerne", w: 15 },
  { name: "Masse de cavalier / légère", w: 6 },
  { name: "Masse de fantassin / lourde", w: 10 },
  { name: "Morgenstern", w: 12 },
  { name: "Pertuisane", w: 8 },
  { name: "Pique", w: 15 },
  { name: "Ranseur", w: 7 },
  { name: "Sarbacane", w: 2 },
  { name: "Spetum", w: 7 },
  { name: "Trident", w: 5 },
  { name: "Vouge", w: 12 }
];

// ── Équipement d'aventurier ─────────────────────────────────────────────────
//   name : nom affiché — w : poids unitaire (liv)
// Source : equipement.csv — « Chaîne (au pied) » : poids non défini (—), fixé à 0
const GEAR = [
  { name: "Ail (3 gousses / tête)", w: 0.5 },
  { name: "Bottes, basses / hautes", w: 0.25 },
  { name: "Bougie (cire / suif)", w: 0.5 },
  { name: "Bourse de ceinture, grande", w: 1 },
  { name: "Bourse de ceinture, petite", w: 0.5 },
  { name: "Bouteille de vin (verre)", w: 1 },
  { name: "Briquet à silex", w: 0.5 },
  { name: "Cape", w: 1 },
  { name: "Carquois (contient 20-24 flèches)", w: 1 },
  { name: "Ceinture", w: 0.3 },
  { name: "Chaîne (au pied)", w: 0 },
  { name: "Chaîne en fer (10 pi)", w: 10 },
  { name: "Coffre, petit", w: 10 },
  { name: "Coffre, grand", w: 25 },
  { name: "Corde en chanvre (50 pi)", w: 20 },
  { name: "Corde en soie (50 pi)", w: 8 },
  { name: "Couverture / Sac de couchage", w: 3 },
  { name: "Craie (morceau)", w: 0.5 },
  { name: "Eau bénite (fiole)", w: 1 },
  { name: "Échelle, 10 pieds", w: 20 },
  { name: "Encre (par fiole / once)", w: 0.1 },
  { name: "Flasque vide (cuir / céramique)", w: 1 },
  { name: "Grappin", w: 4 },
  { name: "Grimoire (vierge, 100-128 pages)", w: 3 },
  { name: "Huile, flasque (lampe / feu grégeois)", w: 1 },
  { name: "Lanterne, sourde / à lentille", w: 3 },
  { name: "Lanterne, standard / sourde", w: 3 },
  { name: "Marteau, petit / Maillet", w: 1 },
  { name: "Miroir en argent", w: 1 },
  { name: "Miroir, petit en acier", w: 0.5 },
  { name: "Outils de voleur (crochets & outils)", w: 1 },
  { name: "Outre à eau / à vin", w: 5 },
  { name: "Palan", w: 10 },
  { name: "Parchemin (feuille)", w: 0.1 },
  { name: "Pelle / Bêche", w: 8 },
  { name: "Perche en bois de 10 pieds", w: 8 },
  { name: "Pied-de-biche", w: 5 },
  { name: "Pierre à aiguiser", w: 1 },
  { name: "Pioche de mineur", w: 10 },
  { name: "Pointes en fer (paquet de 12)", w: 6 },
  { name: "Rations de réserve / de route (1 sem.)", w: 7 },
  { name: "Rations standard / fraîches (1 sem.)", w: 14 },
  { name: "Sac à dos (cuir)", w: 2 },
  { name: "Sac, grand", w: 0.2 },
  { name: "Sac, petit", w: 0.1 },
  { name: "Serrure de qualité / Cadenas", w: 1 },
  { name: "Sifflet d'alerte", w: 0.1 },
  { name: "Symbole sacré en argent", w: 2 },
  { name: "Symbole sacré en bois", w: 0.5 },
  { name: "Tente, petite", w: 20 },
  { name: "Tente, Pavillon", w: 50 },
  { name: "Torches (6-8 torches)", w: 4 },
  { name: "Tue-loup (brin)", w: 0.5 }
];

// ── Monnaies ────────────────────────────────────────────────────────────────
//   name : nom affiché — abbr : abréviation (clé de stockage)
//   w    : poids d'UNE pièce (liv) — réglage : 50 pièces ≈ 1 livre
// La ligne « Monnaie » de chaque conteneur s'adapte automatiquement.
const CURRENCIES = [
  { name: "Pièces de platine", abbr: "pp", w: 0.02 },
  { name: "Pièces d'or", abbr: "po", w: 0.02 },
  { name: "Pièces d'électrum", abbr: "pe", w: 0.02 },
  { name: "Pièces d'argent", abbr: "pa", w: 0.02 },
  { name: "Pièces de cuivre", abbr: "pc", w: 0.02 }
];

// ── Force → charge permise ───────────────────────────────────────────────────
//   s : score de Force (les scores exceptionnels 18/xx sont des textes)
//   max : charge permise (liv) — détermine la limite « Non encombré »
// Source : force.csv (charge_permise_liv)
const STRENGTH_TABLE = [
  { s: 1, max: 1 },
  { s: 2, max: 1 },
  { s: 3, max: 5 },
  { s: 4, max: 10 },
  { s: 5, max: 10 },
  { s: 6, max: 20 },
  { s: 7, max: 20 },
  { s: 8, max: 35 },
  { s: 9, max: 35 },
  { s: 10, max: 40 },
  { s: 11, max: 40 },
  { s: 12, max: 45 },
  { s: 13, max: 45 },
  { s: 14, max: 55 },
  { s: 15, max: 55 },
  { s: 16, max: 70 },
  { s: 17, max: 85 },
  { s: 18, max: 110 },
  { s: "18/01–50", max: 135 },
  { s: "18/51–75", max: 160 },
  { s: "18/76–90", max: 185 },
  { s: "18/91–99", max: 235 },
  { s: "18/00", max: 335 }
];

// ── Dextérité → ajustement de CA ────────────────────────────────────────────
//   s : score — caMod : ajustement (positif = bonus qui FAIT BAISSER la CA,
//   conformément à la convention AD&D 1E « plus basse = meilleure »)
// Source : dexterite.csv (ajustement_CA)
const DEX_TABLE = [
  { s: 3, caMod: -3 }, { s: 4, caMod: -2 }, { s: 5, caMod: -2 }, { s: 6, caMod: -1 },
  { s: 7, caMod: -1 }, { s: 8, caMod: -1 }, { s: 9, caMod: 0 }, { s: 10, caMod: 0 },
  { s: 11, caMod: 0 }, { s: 12, caMod: 0 }, { s: 13, caMod: 1 }, { s: 14, caMod: 1 },
  { s: 15, caMod: 1 }, { s: 16, caMod: 2 }, { s: 17, caMod: 2 }, { s: 18, caMod: 3 }
];

// ── Catégories d'encombrement ───────────────────────────────────────────────
//   name : nom de la catégorie
//   addMin / addMax : bornes en liv AU-DELÀ de la charge permise (force.csv)
//   move : facteur appliqué au mouvement de base ("1" = mouvement figé à 1)
//   atk  : malus d'attaque
// Source : enc_cat.csv — au-delà de +140 liv : immobilisé
const ENC_CATEGORIES = [
  { name: "Non encombré", addMin: 0, addMax: 0, move: 1, atk: 0 },
  { name: "Léger", addMin: 0, addMax: 35, move: 2 / 3, atk: 0 },
  { name: "Modéré", addMin: 35, addMax: 70, move: 1 / 2, atk: 0 },
  { name: "Lourd", addMin: 70, addMax: 105, move: 1 / 3, atk: -1 },
  { name: "Sévère", addMin: 105, addMax: 140, move: "1", atk: -2 }
];
const ENC_MAX_EXCESS = 140; // au-delà de charge permise + 140 liv : immobilisé

// ── Mouvements de base autorisés ─────────────────────────────────────────────
// (12 : humain sans armure lourde ; 9, 6, 3 : armures/races plus encombrantes)
const BASE_MOVES = [12, 9, 6, 3];

// ── Catalogues proposés dans le formulaire d'ajout d'objet ──────────────────
const CATALOGS = [
  { key: "armor", label: "Armures & boucliers", list: ARMORS },
  { key: "weapon", label: "Armes", list: WEAPONS },
  { key: "gear", label: "Équipement d'aventurier", list: GEAR }
];
