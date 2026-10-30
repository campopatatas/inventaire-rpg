/* ============================================================================
   DONNÉES PAR DÉFAUT — Inventaire RPG
   ----------------------------------------------------------------------------
   Uniquement utilisées au tout premier lancement (aucune sauvegarde locale).
   Ensuite, tout est sauvegardé dans le navigateur et exportable en JSON
   via le menu ☰. Les noms d'objets « Porté sur soi » correspondent
   volontairement aux noms de js/config.js (reconnaissance armures/boucliers).
   ============================================================================ */

const DEFAULT_DATA = {
  active: 0,
  chars: [
    {
      name: "Baramund le Clerc", str: 14, baseMove: 12, dex: 10,
      worn: [
        { n: "Masse de fantassin / lourde", q: 1, w: 10 },
        { n: "Cotte de mailles", q: 1, w: 40 },
        { n: "Bouclier, standard", q: 1, w: 10 },
        { n: "Symbole sacré en argent", q: 1, w: 2 }
      ],
      containers: [
        { name: "Sac à dos", selfW: 2, cap: 50, coins: { pp: 0, po: 25, pe: 0, pa: 30, pc: 0 }, items: [
          { n: "Torches", q: 5, w: 1 },
          { n: "Rations de route (1 sem.)", q: 7, w: 1 }
        ] },
        { name: "Bourse de ceinture, petite", selfW: 0.5, cap: 5, coins: { pp: 0, po: 0, pe: 0, pa: 0, pc: 0 }, items: [
          { n: "Eau bénite (fiole)", q: 2, w: 0.5 }
        ] }
      ]
    },
    {
      name: "Felia la Voleuse", str: 11, baseMove: 12, dex: 15,
      worn: [
        { n: "Dague / Couteau", q: 1, w: 1 },
        { n: "Arc court", q: 1, w: 2 }
      ],
      containers: [
        { name: "Sac à dos", selfW: 2, cap: 50, coins: { pp: 0, po: 42, pe: 0, pa: 15, pc: 60 }, items: [
          { n: "Carquois (contient 20-24 flèches)", q: 1, w: 1 },
          { n: "Outils de voleur (crochets & outils)", q: 1, w: 1 },
          { n: "Corde en chanvre (50 pi)", q: 1, w: 20 }
        ] }
      ]
    },
    {
      name: "Coffre de groupe", maxLoad: 250, isChest: true,
      coins: { pp: 0, po: 350, pe: 0, pa: 0, pc: 0 },
      items: [
        { n: "Potion de soins", q: 2, w: 0.5 },
        { n: "Corde en soie (50 pi)", q: 1, w: 5 }
      ]
    }
  ]
};
