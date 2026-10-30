/* ============================================================================
   APPLICATION — Inventaire RPG (OSE / AD&D 1E)
   ----------------------------------------------------------------------------
   Aucune dépendance, aucun serveur : site 100 % statique.
   Scripts classiques (pas de modules) pour que le site fonctionne aussi
   en ouvrant index.html directement depuis le disque (double-clic).
   ============================================================================ */

"use strict";

// ── Persistance ─────────────────────────────────────────────────────────────

const LS_KEY = "inventaire-rpg-v2";

let data;
try { data = JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch (e) { data = null; }
if (!data || !data.chars) data = JSON.parse(JSON.stringify(DEFAULT_DATA));

let storageOk = true;
try {
  localStorage.setItem(LS_KEY + "-test", "1");
  localStorage.removeItem(LS_KEY + "-test");
} catch (e) { storageOk = false; }

function save() {
  if (!storageOk) return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
}

// Normalise les données (migration + valeurs par défaut).
// Appelée au chargement et après import JSON : tout fichier partiel atterrit
// proprement (sac à dos manquant, ligne Monnaie absente, Force/Dex non définies…).
function normalizeData() {
  data.chars.forEach(c => {
    if (c.isChest) {
      if (!c.items) c.items = [];
      if (!c.maxLoad) c.maxLoad = 250;
      if (!c.coins) c.coins = {};
      CURRENCIES.forEach(cur => { if (c.coins[cur.abbr] == null) c.coins[cur.abbr] = 0; });
      return;
    }
    // Migration v1 → v2 : l'ancienne liste d'objets devient « Porté sur soi »
    if (!c.worn && c.items) {
      c.worn = c.items;
      delete c.items;
    }
    if (!c.worn) c.worn = [];
    if (!c.containers) c.containers = [{ name: "Sac à dos", cap: 40, items: [] }];
    c.containers.forEach(cont => {
      if (cont.selfW == null) {
        const t = CONTAINER_TYPES.find(t => t.name === cont.name);
        cont.selfW = t ? t.selfW : 0;
      }
      if (!cont.coins) cont.coins = {};
      CURRENCIES.forEach(cur => { if (cont.coins[cur.abbr] == null) cont.coins[cur.abbr] = 0; });
    });
    // Migration : l'ancienne bourse de personnage → ligne Monnaie du 1er conteneur
    if (c.coins && c.containers.length && Object.values(c.coins).some(v => v > 0)) {
      const dest = c.containers[0].coins;
      CURRENCIES.forEach(cur => { dest[cur.abbr] = (dest[cur.abbr] || 0) + (c.coins[cur.abbr] || 0); });
      delete c.coins;
    }
    // Force : charge permise dérivée de la table de configuration
    if (c.str == null) {
      const t = STRENGTH_TABLE.find(x => x.max === c.maxLoad);
      c.str = t ? t.s : 10;
    }
    c.maxLoad = (STRENGTH_TABLE.find(x => x.s === c.str) || STRENGTH_TABLE[0]).max;
    if (c.baseMove == null) c.baseMove = 12;
    if (c.dex == null) c.dex = 10;
  });
  if (data.active == null || data.active < 0 || data.active >= data.chars.length) data.active = 0;
}
normalizeData();

// ── Utilitaires ─────────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}
function emptyCoins() {
  const coins = {};
  CURRENCIES.forEach(cur => coins[cur.abbr] = 0);
  return coins;
}

// ── Poids et calculs de jeu ─────────────────────────────────────────────────

function itemsWeight(items) { return (items || []).reduce((s, it) => s + it.q * it.w, 0); }
function coinsWeight(coins) {
  return CURRENCIES.reduce((s, cur) => s + (coins ? (coins[cur.abbr] || 0) * cur.w : 0), 0);
}
function contWeight(cont) { return itemsWeight(cont.items) + (cont.selfW || 0) + coinsWeight(cont.coins); }

function totalWeight(c) {
  if (c.isChest) return itemsWeight(c.items) + coinsWeight(c.coins);
  return itemsWeight(c.worn) + c.containers.reduce((s, cont) => s + contWeight(cont), 0);
}

// Catégorie d'encombrement courante (null = immobilisé)
function encCategoryOf(c) {
  const tw = totalWeight(c), base = c.maxLoad;
  if (tw <= base) return ENC_CATEGORIES[0];
  if (tw > base + ENC_MAX_EXCESS) return null;
  for (let i = ENC_CATEGORIES.length - 1; i >= 1; i--) {
    if (tw > base + ENC_CATEGORIES[i].addMin) return ENC_CATEGORIES[i];
  }
  return ENC_CATEGORIES[0];
}
function encMove(c, cat) {
  if (!cat) return 0;
  if (cat.move === "1") return 1; // catégorie « Sévère » : mouvement figé à 1
  return Math.round(c.baseMove * cat.move * 10) / 10;
}

// Classe d'Armure — convention AD&D 1E (plus basse = meilleure).
// CA = CA de l'armure portée (ou 10) − ajustement de Dextérité + modificateur
// de bouclier. L'armure et le bouclier sont déduits des objets « Porté sur soi »
// par reconnaissance du nom (cf. ARMORS dans js/config.js).
function getCA(c) {
  const dexMod = (DEX_TABLE.find(x => x.s === (c.dex == null ? 10 : c.dex)) || DEX_TABLE[0]).caMod;
  const worn = c.worn || [];
  const armorsWorn = ARMORS.filter(a => a.ca > 0 && worn.some(it => it.n === a.name));
  const shieldsWorn = ARMORS.filter(a => a.ca < 0 && worn.some(it => it.n === a.name));
  const armorCa = armorsWorn.length ? Math.min(...armorsWorn.map(a => a.ca)) : 10;
  return armorCa - dexMod + (shieldsWorn.length ? Math.min(...shieldsWorn.map(a => a.ca)) : 0);
}

// Lieux de stockage d'un personnage : "worn" ou "c" + index du conteneur
function getPlace(c, place) {
  if (place === "worn") return c.worn;
  const i = parseInt(place.slice(1));
  return c.containers[i] ? c.containers[i].items : null;
}

// ── Rendu : onglets ─────────────────────────────────────────────────────────

const CHEST_NAME_RE = /coffre|trésor|butin/i;

function render() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";
  data.chars.forEach((c, i) => {
    const t = document.createElement("div");
    t.className = "tab" + (i === data.active ? " active" : "");
    let label = esc(c.name);
    if (!c.isChest) {
      const cat = encCategoryOf(c);
      label += " <span class='tabmeta'>CA " + getCA(c) + "</span> <span class='tabmv'>MV " + encMove(c, cat) + "</span>";
    }
    t.innerHTML = label;
    t.onclick = () => { data.active = i; save(); render(); };
    tabs.appendChild(t);
  });

  const add = document.createElement("div");
  add.className = "tab addchar";
  add.textContent = "+ personnage";
  add.onclick = () => promptNewChar(add, tabs);
  tabs.appendChild(add);

  renderActive();
}

function promptNewChar(add, tabs) {
  add.style.display = "none";
  const row = document.createElement("div");
  row.className = "tab";
  row.innerHTML = "<input id='newchar-name' placeholder='Nom…'>";
  tabs.appendChild(row);
  const inp = row.querySelector("#newchar-name");
  inp.focus();
  const confirmAdd = () => {
    const name = inp.value.trim();
    row.remove();
    add.style.display = "";
    if (!name) return;
    if (CHEST_NAME_RE.test(name)) {
      data.chars.push({ name, maxLoad: 250, isChest: true, items: [], coins: emptyCoins() });
    } else {
      const sac = CONTAINER_TYPES.find(t => t.name === "Sac à dos");
      const defStr = STRENGTH_TABLE.find(x => x.s === 10) || STRENGTH_TABLE[0];
      data.chars.push({
        name, str: defStr.s, maxLoad: defStr.max, baseMove: 12, dex: 10, worn: [],
        containers: [{
          name: sac ? sac.name : "Sac à dos",
          selfW: sac ? sac.selfW : 2,
          cap: sac ? sac.cap : 40,
          items: [], coins: emptyCoins()
        }]
      });
    }
    data.active = data.chars.length - 1;
    save();
    render();
  };
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") confirmAdd();
    if (e.key === "Escape") { row.remove(); add.style.display = ""; }
  });
  inp.addEventListener("blur", () => setTimeout(() => { if (document.body.contains(row)) confirmAdd(); }, 100));
}

// ── Rendu : fiche du personnage actif ───────────────────────────────────────

const TABLEHEAD = "<tr><th></th><th>Objet</th><th class='w'>Qté</th><th class='w'>Pds/unité</th><th class='w'>Total</th><th></th></tr>";

function itemRows(items, place, opts) {
  if (!items.length) return "<tr><td colspan='6' class='empty'>" + (opts.emptyText || "Vide") + "</td></tr>";
  let rows = "";
  items.forEach((it, idx) => {
    const up = idx > 0 ? `<span onclick="moveItem('${place}',${idx},-1)">▲</span>` : `<span class="off">▲</span>`;
    const dn = idx < items.length - 1 ? `<span onclick="moveItem('${place}',${idx},1)">▼</span>` : `<span class="off">▼</span>`;
    const mv = opts.showMove ? `<span class="mv" onclick="cycleItem('${place}',${idx})" title="Transférer vers un autre emplacement">⇄</span>` : "";
    rows += "<tr><td class='arw'>" + up + dn + "</td>" +
      "<td class='rowitem' oncontextmenu='showTransferMenu(event,\"" + place + "\"," + idx + ")' title='Clic droit : transférer'>" + esc(it.n) + "</td>" +
      "<td class='w'>× " + it.q + "</td><td class='w'>" + it.w + " liv</td>" +
      "<td class='w'><b>" + (it.q * it.w).toFixed(1) + " liv</b></td>" +
      "<td class='w'>" + mv + "<span class='del' onclick='delItem(\"" + place + "\"," + idx + ")'>✕</span></td></tr>";
  });
  return rows;
}

function barHtml(tw, max, compact) {
  const pct = Math.min(100, max > 0 ? (tw / max) * 100 : 0);
  const cls = tw > max ? "over" : (tw > max * 0.75 ? "warn" : "");
  return `<div class="barbg"><div class="barfg ${cls}" style="width:${pct}%">${compact ? "" : tw.toFixed(1) + " / " + max + " liv"}</div></div>`;
}

// Barre d'encombrement segmentée par catégorie, avec marqueur de charge actuelle
function encBarHtml(c) {
  const tw = totalWeight(c), base = c.maxLoad;
  const total = base + ENC_MAX_EXCESS;
  const pos = Math.min(100, (tw / total) * 100);
  const cat = encCategoryOf(c);
  const cls = !cat ? "enc5" : "enc" + ENC_CATEGORIES.indexOf(cat);

  let zones = "";
  let prev = 0;
  ENC_CATEGORIES.forEach((k, i) => {
    const w = ((Math.min(base + k.addMax, total) - prev) / total) * 100;
    if (w > 0) zones += `<div class="enczone encz${i}" style="left:${(prev / total) * 100}%;width:${w}%"></div>`;
    prev = base + k.addMax;
  });

  let legend = "";
  ENC_CATEGORIES.forEach((k, i) => {
    const lo = i === 0 ? "0" : String(base + k.addMin);
    const hi = String(base + k.addMax);
    const active = cat === k ? " encactive" : "";
    legend += `<span class="encleg${active}"><span class="encdot encz${i}"></span>${k.name} <span class="encrange">${lo}–${hi} liv</span></span>`;
  });
  legend += `<span class="encleg${!cat ? " encactive" : ""}"><span class="encdot encz5"></span>Immobilisé</span>`;

  const curMove = encMove(c, cat), atk = cat ? cat.atk : -2;
  return `
    <div class="barbg encbar">${zones}<div class="encfill ${cls}" style="width:${pos}%"></div><div class="encmark" style="left:${pos}%"></div></div>
    <div class="enclegend">${legend}</div>
    <div class="loadtext encsummary">
      ${tw.toFixed(1)} liv — <b>${!cat ? "IMMOBILISÉ" : esc(cat.name)}</b>
      — Mouvement : <b>${curMove}</b> (base ${c.baseMove})${atk ? ` — Attaque : <b class="atkpen">${atk}</b>` : ""}
    </div>`;
}

// Ligne « Monnaie » d'un conteneur (contIdx = index du conteneur, ou null pour le coffre)
function coinLine(coins, contIdx) {
  if (!coins) coins = {};
  const setter = contIdx === null ? "setCoins(\"" : "setContCoins(" + contIdx + ", \"";
  let fields = "";
  CURRENCIES.forEach(cur => {
    const q = coins[cur.abbr] || 0;
    fields += "<span class='coinfield'><label>" + cur.abbr +
      " <input type='number' min='0' class='coininp' value='" + q +
      "' onchange='" + setter + cur.abbr + "\", this.value)'></label></span>";
  });
  const tw = coinsWeight(coins);
  return "<div class='coinrow'><span class='coinlabel'>Monnaie</span>" + fields +
    "<span class='seccount cointotal'><b>" + tw.toFixed(2) + " liv</b></span></div>";
}

function optionHtml(value, label, selected) {
  return "<option value='" + esc(String(value)) + "'" + (selected ? " selected" : "") + ">" + esc(String(label)) + "</option>";
}

function renderActive() {
  const c = data.chars[data.active];
  const card = document.getElementById("charcard");
  const tw = totalWeight(c);

  // Ligne 1 : nom + Renommer ; Ligne 2 : Force / Mouv. base / Charge permise ;
  // Ligne 3 : Dextérité / CA (personnages uniquement)
  let html = `
    <div class="charhead">
      <span class="charname">${esc(c.name)}</span>
      <button class="ghost nomargin" onclick="renameChar()">Renommer</button>
    </div>
    <div class="charhead">`;

  if (c.isChest) {
    html += `<label class="statlabel">Charge max (liv)
      <input type="number" class="maxload-inp" value="${c.maxLoad}" onchange="setMax(this.value)"></label>`;
  } else {
    html += `<span class="statgroup">
      <label class="statlabel">Force
        <select id="str-sel" class="stat-sel" onchange="setStr(this.value)">
          ${STRENGTH_TABLE.map(x => optionHtml(x.s, x.s, String(x.s) === String(c.str))).join("")}
        </select></label>
      <label class="statlabel">Mouv. de base
        <select class="stat-sel narrow" onchange="setMove(this.value)">
          ${BASE_MOVES.map(m => optionHtml(m, m, m === c.baseMove)).join("")}
        </select></label>
      <span class="statlabel">Charge permise : <b class="statval">${c.maxLoad} liv</b></span>
    </span>
    </div>
    <div class="charhead">
      <label class="statlabel">Dextérité
        <select id="dex-sel" class="stat-sel" onchange="setDex(this.value)">
          ${DEX_TABLE.map(x => optionHtml(x.s, x.s, x.s === (c.dex == null ? 10 : c.dex))).join("")}
        </select></label>
      <span class="statlabel">CA : <b class="statval ca">${getCA(c)}</b></span>`;
  }
  html += `</div>
    <div class="loadbar">
      ${c.isChest ? barHtml(tw, c.maxLoad) : encBarHtml(c)}
      <div class="loadtext">≈ ${(tw * 0.5).toFixed(1)} kg — ${tw > c.maxLoad + ENC_MAX_EXCESS ? "⚠️ IMMOBILISÉ !" : (tw > c.maxLoad ? "⚠️ SURCHARGÉ !" : (tw > c.maxLoad * 0.75 ? "Charge élevée" : "Charge normale"))}</div>
    </div>`;

  if (c.isChest) {
    html += `<div class="section">
      <div class="sechead"><span class="sectitle">Contenu du coffre</span>
        <span class="seccount">${itemsWeight(c.items).toFixed(1)} liv</span></div>
      <table>${TABLEHEAD}${itemRows(c.items, "worn", {})}</table>
      ${coinLine(c.coins, null)}
    </div>`;
  } else {
    const wornW = itemsWeight(c.worn);
    html += `<div class="section">
      <div class="sechead"><span class="sectitle">Porté sur soi</span>
        <span class="seccount">${wornW.toFixed(1)} liv</span></div>
      <table>${TABLEHEAD}${itemRows(c.worn, "worn", { showMove: true, emptyText: "Rien de porté" })}</table>
    </div>`;

    html += `<div class="section">
      <div class="sechead">
        <span class="sectitle">Conteneurs</span>
        <span class="statgroup">
          <span class="seccount">${c.containers.length} conteneur(s)</span>
          <button id="btn-addcont" class="ghost nomargin" onclick="event.stopPropagation(); addCont()">+ conteneur</button>
        </span>
      </div>`;
    c.containers.forEach((cont, i) => {
      const cw = contWeight(cont);
      const full = cw - (cont.selfW || 0) - coinsWeight(cont.coins) > cont.cap ? " ⚠️" : "";
      html += `<div class="container">
        <div class="sechead">
          <span class="contname">${esc(cont.name)}</span>
          <span class="statgroup">
            <span class="seccount">∅ ${cont.selfW || 0} liv — capacité ${cont.cap} liv</span>
            <span class="secload" title="contenu ${(cw - (cont.selfW || 0) - coinsWeight(cont.coins)).toFixed(1)} / ${cont.cap} liv">${barHtml(cw - (cont.selfW || 0) - coinsWeight(cont.coins), cont.cap, true)}</span>
            <span class="mv" title="Supprimer le conteneur" onclick="delCont(${i})">✕</span>
          </span>
        </div>
        <table>${TABLEHEAD}${itemRows(cont.items, "c" + i, { showMove: true, emptyText: "Conteneur vide" })}</table>
        ${coinLine(cont.coins, i)}
        <div class="seccount contright">contenu ${(cw - (cont.selfW || 0) - coinsWeight(cont.coins)).toFixed(1)} / ${cont.cap} liv${full} — monnaie ${coinsWeight(cont.coins).toFixed(2)} liv — total avec le sac : ${cw.toFixed(1)} liv</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Formulaire d'ajout d'objet (catalogues configurés + choix de la destination)
  const destOpts = c.isChest
    ? "<option value='worn'>Coffre</option>"
    : "<option value='worn'>Porté sur soi</option>" +
      c.containers.map((cont, i) => "<option value='c" + i + "'>" + esc(cont.name) + "</option>").join("");
  html += `<div class="newrow">
      <select id="in-cat" title="Catalogue">
        <option value="custom">— Objet libre —</option>
        ${CATALOGS.map(cat => optionHtml(cat.key, cat.label, false)).join("")}
      </select>
      <select id="in-item" style="display:none"></select>
      <input id="in-name" placeholder="Nom de l'objet" />
      <select id="in-dest">${destOpts}</select>
      <input id="in-qty" type="number" min="1" value="1" title="Quantité" />
      <input id="in-w" type="number" min="0" step="0.5" placeholder="lb" title="Poids unitaire" />
      <button onclick="addItem()">Ajouter</button>
    </div>`;

  card.innerHTML = html;
  // Synchronise explicitement les sélecteurs (évite tout désynchro d'affichage)
  const strSel = document.getElementById("str-sel");
  if (strSel) strSel.value = String(c.str != null ? c.str : 10);
  const dexSel = document.getElementById("dex-sel");
  if (dexSel) dexSel.value = String(c.dex != null ? c.dex : 10);
  wireAddForm();
}

// Branche le formulaire d'ajout sur les catalogues configurés
function wireAddForm() {
  const catSel = document.getElementById("in-cat");
  const itemSel = document.getElementById("in-item");
  const nameInp = document.getElementById("in-name");
  const wInp = document.getElementById("in-w");
  if (!catSel) return;

  const useCustom = () => {
    itemSel.style.display = "none";
    nameInp.style.display = "";
    wInp.readOnly = false;
    wInp.value = "";
    nameInp.focus();
  };
  const useCatalog = (cat) => {
    nameInp.style.display = "none";
    itemSel.style.display = "";
    itemSel.innerHTML = cat.list.map((it, i) => optionHtml(i, (it.n || it.name) + " — " + it.w + " liv", false)).join("");
    wInp.readOnly = true;
    wInp.value = cat.list[0].w;
    itemSel.focus();
  };
  catSel.onchange = () => {
    const cat = CATALOGS.find(c => c.key === catSel.value);
    if (cat) useCatalog(cat); else useCustom();
  };
  itemSel.onchange = () => {
    const cat = CATALOGS.find(c => c.key === catSel.value);
    if (cat) wInp.value = cat.list[itemSel.value].w;
  };
}

// ── Actions sur les objets ──────────────────────────────────────────────────

function addItem() {
  const c = data.chars[data.active];
  const catSel = document.getElementById("in-cat");
  const cat = CATALOGS.find(x => x.key === catSel.value);
  let n, w;
  if (cat) {
    n = cat.list[document.getElementById("in-item").value].name;
    w = cat.list[document.getElementById("in-item").value].w;
  } else {
    n = document.getElementById("in-name").value.trim();
    w = parseFloat(document.getElementById("in-w").value);
    if (!n) { alert("Donne un nom à l'objet."); return; }
    if (isNaN(w)) w = 0;
  }
  const q = parseInt(document.getElementById("in-qty").value) || 1;
  const items = getPlace(c, document.getElementById("in-dest").value);
  if (!items) return;
  items.push({ n, q, w });
  save();
  render();
}

function delItem(place, i) {
  getPlace(data.chars[data.active], place).splice(i, 1);
  save(); render();
}

function moveItem(place, i, dir) {
  const items = getPlace(data.chars[data.active], place);
  const j = i + dir;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  save(); render();
}

// Transfert d'un objet au sein du personnage : porte → conteneurs → porte
function cycleItem(place, i) {
  const c = data.chars[data.active];
  const items = getPlace(c, place);
  const [it] = items.splice(i, 1);
  if (c.isChest) { items.splice(i, 0, it); return; }
  const places = ["worn"].concat(c.containers.map((_, k) => "c" + k));
  const next = places[(places.indexOf(place) + 1) % places.length];
  getPlace(c, next).push(it);
  save(); render();
}

// ── Menu contextuel de transfert entre personnages ─────────────────────────

let pendingTransfer = null; // { charIdx, place, itemIdx }

function closeCtxMenu() {
  const m = document.getElementById("ctxmenu");
  if (m) m.remove();
  pendingTransfer = null;
}

function showTransferMenu(e, place, i) {
  e.preventDefault();
  closeCtxMenu();
  const srcIdx = data.active;
  pendingTransfer = { charIdx: srcIdx, place, itemIdx: i };
  const item = getPlace(data.chars[srcIdx], place)[i];

  const menu = document.createElement("div");
  menu.id = "ctxmenu";
  let html = "<div class='ctxhead'>Transférer : " + esc(item.n) + "</div>";
  data.chars.forEach((c, ci) => {
    if (ci === srcIdx) return;
    html += "<div class='ctxchar'>" + esc(c.name) + "</div>";
    if (c.isChest) {
      html += "<div class='ctxopt' onclick='doTransfer(" + ci + ",\"worn\")'>→ Contenu du coffre</div>";
    } else {
      html += "<div class='ctxopt' onclick='doTransfer(" + ci + ",\"worn\")'>→ Porté sur soi</div>";
      c.containers.forEach((cont, k) => {
        html += "<div class='ctxopt' onclick='doTransfer(" + ci + ",\"c" + k + "\")'>→ " + esc(cont.name) +
          " (" + contWeight(cont).toFixed(1) + "/" + cont.cap + " liv)</div>";
      });
    }
  });
  if (data.chars.length < 2) html += "<div class='ctxempty'>Aucun autre personnage…</div>";
  menu.innerHTML = html;
  document.body.appendChild(menu);

  const r = menu.getBoundingClientRect();
  menu.style.left = Math.min(e.clientX, window.innerWidth - r.width - 8) + "px";
  menu.style.top = Math.min(e.clientY, window.innerHeight - r.height - 8) + "px";
}

function doTransfer(destChar, destPlace) {
  if (!pendingTransfer) return;
  const { charIdx, place, itemIdx } = pendingTransfer;
  const items = getPlace(data.chars[charIdx], place);
  const [it] = items.splice(itemIdx, 1);
  const dest = getPlace(data.chars[destChar], destPlace);
  if (dest) dest.push(it);
  closeCtxMenu();
  save(); render();
}

// ── Conteneurs ──────────────────────────────────────────────────────────────

function addCont() {
  const c = data.chars[data.active];
  if (c.isChest) return;
  const menu = document.createElement("div");
  menu.id = "ctxmenu";
  let html = "<div class='ctxhead'>Ajouter un conteneur</div>";
  CONTAINER_TYPES.forEach((t, i) => {
    html += "<div class='ctxopt' onclick='addContFromType(" + i + ")'>" + esc(t.name) +
      " <span class='ctxsub'>(∅ " + t.selfW + " liv, cap. " + t.cap + " liv)</span></div>";
  });
  menu.innerHTML = html;
  document.body.appendChild(menu);
  const r = menu.getBoundingClientRect();
  const btn = document.getElementById("btn-addcont");
  const br = btn.getBoundingClientRect();
  menu.style.left = Math.min(br.left, window.innerWidth - r.width - 8) + "px";
  menu.style.top = Math.max(8, br.top - r.height - 4) + "px";
  menu.addEventListener("click", e => e.stopPropagation());
}

function addContFromType(ti) {
  const t = CONTAINER_TYPES[ti];
  data.chars[data.active].containers.push({ name: t.name, selfW: t.selfW, cap: t.cap, items: [], coins: emptyCoins() });
  closeCtxMenu();
  save(); render();
}

function delCont(i) {
  const c = data.chars[data.active];
  if (c.containers[i].items.length && !confirm("Supprimer ce conteneur et tout son contenu ?")) return;
  c.containers.splice(i, 1);
  save(); render();
}

// ── Statistiques du personnage ───────────────────────────────────────────────

function setMax(v) {
  const c = data.chars[data.active];
  c.maxLoad = parseFloat(v) || 250;
  save(); render();
}
function setStr(v) {
  const c = data.chars[data.active];
  const t = STRENGTH_TABLE.find(x => String(x.s) === String(v));
  if (!t) return; // validation stricte : score hors table refusé
  c.str = t.s;
  c.maxLoad = t.max;
  save(); render();
}
function setMove(v) {
  const c = data.chars[data.active];
  const m = BASE_MOVES.find(x => x === parseInt(v));
  if (!m) return; // validation stricte : seules les valeurs de BASE_MOVES sont admises
  c.baseMove = m;
  save(); render();
}
function setDex(v) {
  const c = data.chars[data.active];
  const t = DEX_TABLE.find(x => x.s === parseInt(v));
  if (!t) return; // validation stricte : score hors table refusé
  c.dex = t.s;
  save(); render();
}

// ── Monnaie ─────────────────────────────────────────────────────────────────

function setContCoins(contIdx, abbr, v) {
  const cont = data.chars[data.active].containers[contIdx];
  cont.coins[abbr] = Math.max(0, parseInt(v) || 0);
  save(); render();
}
function setCoins(abbr, v) {
  const c = data.chars[data.active];
  if (!c.coins) c.coins = {};
  c.coins[abbr] = Math.max(0, parseInt(v) || 0);
  save(); render();
}

// ── Renommage ───────────────────────────────────────────────────────────────

function renameChar() {
  const c = data.chars[data.active];
  const span = document.querySelector(".charname");
  const old = c.name;
  span.innerHTML = "<input id='rename-input' value='" + esc(old) + "'>";
  const inp = document.getElementById("rename-input");
  inp.focus();
  inp.select();
  const done = () => {
    c.name = inp.value.trim() || old;
    save(); render();
  };
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") done();
    if (e.key === "Escape") render();
  });
  inp.addEventListener("blur", done);
}

// ── Export / Import JSON (menu ☰) ───────────────────────────────────────────

function exportData() {
  document.getElementById("export-json").value = JSON.stringify(data, null, 2);
  document.getElementById("export-dialog").style.display = "flex";
}
function closeExportDialog(e) {
  if (e && e.target && e.target.id !== "export-dialog") return; // seul le fond ferme la boîte
  document.getElementById("export-dialog").style.display = "none";
}
function downloadJSON() {
  const blob = new Blob([document.getElementById("export-json").value], { type: "application/json" });
  const a = document.createElement("a");
  const d = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = "inventaire-" + d + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function copyJSON() {
  const ta = document.getElementById("export-json");
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  if (ok) alert("Inventaire copié dans le presse-papier ! Collez-le dans un fichier texte et sauvegardez-le en .json");
  else alert("Copie impossible : sélectionnez le texte ci-dessus et copiez-le manuellement (Ctrl+C).");
}
function importData() { document.getElementById("import-file").click(); }

// Remise à zéro complète (retour aux données par défaut de js/data.js)
function resetAll() {
  if (!confirm("Tout effacer ? Ceci supprimera TOUS les personnages, conteneurs et monnaies sauvegardés dans ce navigateur (sauf si tu les as exportés).\n\nContinuer ?")) return;
  data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  normalizeData();
  save();
  render();
}
function toggleDataMenu(e) {
  e.stopPropagation();
  document.getElementById("datamenu").classList.toggle("open");
}
function closeDataMenu() {
  const m = document.getElementById("datamenu");
  if (m) m.classList.remove("open");
}

function wireImport() {
  const f = document.getElementById("import-file");
  f.addEventListener("change", () => {
    const file = f.files && f.files[0];
    f.value = ""; // permet de réimporter le même fichier ensuite
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let imported;
      try { imported = JSON.parse(reader.result); }
      catch (e) { alert("Fichier JSON illisible : " + e.message); return; }
      if (!imported || !Array.isArray(imported.chars) || !imported.chars.length) {
        alert("Ce fichier ne contient pas d'inventaire valide (personnages introuvables).");
        return;
      }
      if (!confirm("Importer ce fichier remplacera TOUS les inventaires actuels.\nContinuer ?")) return;
      data = imported;
      normalizeData();
      save();
      render();
    };
    reader.readAsText(file);
  });
}

// ── Événements globaux ──────────────────────────────────────────────────────

document.addEventListener("click", e => {
  closeCtxMenu(); // ferme le menu de transfert au clic ailleurs
  const m = document.getElementById("datamenu");
  if (m && m.classList.contains("open") && !m.contains(e.target)) closeDataMenu();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeCtxMenu();
  if (e.key === "Enter" && document.activeElement && document.activeElement.id === "in-w") addItem();
});

// ── Démarrage ───────────────────────────────────────────────────────────────

wireImport();
render();
