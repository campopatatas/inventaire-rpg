/* ============================================================================
   DONNÉES PAR DÉFAUT — Inventaire RPG
   ----------------------------------------------------------------------------
   Uniquement utilisées au tout premier lancement (aucune sauvegarde locale)
   et via le menu ☰ → « Tout effacer ». Ensuite, tout est sauvegardé dans le
   navigateur et exportable en JSON. Ajoute ici tes personnages de départ si
   tu veux un modèle pré-rempli (structure : voir normalizeData dans js/app.js).
   ============================================================================ */

const DEFAULT_DATA = {
  active: 0,
  chars: [
    {
      name: "Coffre de groupe", maxLoad: 250, isChest: true,
      coins: { pp: 0, po: 0, pe: 0, pa: 0, pc: 0 },
      items: []
    }
  ]
};
