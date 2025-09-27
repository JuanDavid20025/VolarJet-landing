/* ====== VOLARJET – Selección de asientos ====== */

/* --- Configuración de ejemplo (puedes mover a tu API) --- */
const ROWS = 30;
const COLS = ["A","B","C","D","E","F"]; // pasillo entre C y D

// Precios por tipo
const PRICE = {
  base: 0,
  preferred: 20000,
  extra: 40000,
};

// Filas preferenciales y extra espacio (salida de emergencia)
const PREFERRED_ROWS = [1,2,3];
const EXTRA_ROWS = [12,13];

/* --- Utilidades --- */
function formatCOP(n){
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
}

/* --- Estado global --- */
const ctx = (()=>{ // del buscador
  try { return JSON.parse(localStorage.getItem("searchCtx") || "{}"); }
  catch { return {}; }
})();
const seleccion = (()=>{ // del paso de resultados (vuelo elegido)
  try { return JSON.parse(localStorage.getItem("seleccion") || "{}"); }
  catch { return {}; }
})();

// # de pasajeros con asiento (adultos + niños); infantes no ocupan asiento
const paxCount = (ctx?.pax?.adt || 1) + (ctx?.pax?.chd || 0);
const paxInf   = (ctx?.pax?.inf || 0);

let selected = []; // [{row, col, type, price}]

/* --- Elementos --- */
const resumen = document.getElementById("resumen");
const aircraft = document.getElementById("aircraft");
const listaAsientos = document.getElementById("listaAsientos");
const totalEl = document.getElementById("total");
const paxContEl = document.getElementById("paxCont");
const continuarBtn = document.getElementById("continuar");
const vueloBox = document.getElementById("vuelo");

/* --- Init --- */
function init(){
  // Resumen arriba
  const r = seleccion?.vuelo || {};
  const rutaTxt = r.o && r.d ? `${r.o} → ${r.d}` : "Ruta no definida";
  const fechaTxt = r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "";
  const horaTxt = r.dep && r.arr ? `· ${r.dep} – ${r.arr}` : "";
  resumen.textContent = `${rutaTxt} ${horaTxt} ${fechaTxt ? "· "+fechaTxt : ""}`;

  // Caja vuelo en sidebar
  vueloBox.innerHTML = `
    <div class="row"><span>Vuelo</span><strong>${r.id || "—"}</strong></div>
    <div class="row"><span>Ruta</span><strong>${rutaTxt}</strong></div>
    <div class="row"><span>Fecha</span><strong>${fechaTxt || "—"}</strong></div>
    <div class="row"><span>Cabina</span><strong>${ctx?.cabina || "Economy"}</strong></div>
    <div class="row"><span>Pasajeros</span><strong>${paxCount} (+${paxInf} inf.)</strong></div>
  `;

  buildSeats();
  updateSummary();
}

function buildSeats(){
  // Generar un set de asientos ocupados de ejemplo
  const occupied = new Set();
  // marcar aleatorios
  for(let i=0;i<40;i++){
    const r = 1 + Math.floor(Math.random()*ROWS);
    const c = COLS[Math.floor(Math.random()*COLS.length)];
    occupied.add(`${r}${c}`);
  }

  // Render por filas
  aircraft.innerHTML = "";
  for(let row=1; row<=ROWS; row++){
    const rowWrap = document.createElement("div");
    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = `Fila ${row}`;
    rowWrap.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "seat-grid";

    COLS.forEach((col, idx)=>{
      if(idx === 3){ // pasillo
        const gap = document.createElement("div");
        gap.style.width = "var(--seat-gap)";
        grid.appendChild(gap);
      }

      const id = `${row}${col}`;
      const seat = document.createElement("div");
      seat.className = "seat";
      seat.dataset.id = id;

      // estado por defecto
      let type = "base";
      if(PREFERRED_ROWS.includes(row)) type = "preferred";
      if(EXTRA_ROWS.includes(row)) type = "extra";

      // ocupado?
      if(occupied.has(id)){
        seat.classList.add("occupied");
      } else {
        seat.classList.add(type === "preferred" ? "preferred" : type === "extra" ? "extra" : "");
        seat.addEventListener("click", ()=>toggleSeat(id, type));
      }

      seat.textContent = col;
      seat.title = `${id} · ${type === "preferred" ? "+ " + formatCOP(PRICE.preferred) : type==="extra" ? "+ " + formatCOP(PRICE.extra) : "Sin costo"}`;
      grid.appendChild(seat);
    });

    rowWrap.appendChild(grid);
    aircraft.appendChild(rowWrap);
  }
}

function toggleSeat(id, type){
  const idx = selected.findIndex(s => s.id === id);
  if(idx >= 0){
    selected.splice(idx,1);
    markSeat(id,false,type);
  } else {
    if(selected.length >= paxCount){
      alert(`Puedes seleccionar hasta ${paxCount} asiento(s).`);
      return;
    }
    selected.push({ id, type, price: type==="preferred" ? PRICE.preferred : type==="extra" ? PRICE.extra : PRICE.base });
    markSeat(id,true,type);
  }
  updateSummary();
}

function markSeat(id, isSelected, type){
  const el = document.querySelector(`.seat[data-id="${id}"]`);
  if(!el || el.classList.contains("occupied")) return;
  el.classList.toggle("selected", isSelected);
}

function updateSummary(){
  paxContEl.textContent = `${selected.length} / ${paxCount}`;
  listaAsientos.innerHTML = "";
  let sum = 0;

  selected.forEach(s=>{
    sum += s.price;
    const li = document.createElement("li");
    const label = document.createElement("span");
    const price = document.createElement("strong");

    const nice = s.type==="preferred" ? "Preferencial" : s.type==="extra" ? "Extra espacio" : "Estándar";
    label.textContent = `${s.id} · ${nice}`;
    price.textContent = s.price ? `+ ${formatCOP(s.price)}` : "Incluido";
    li.appendChild(label); li.appendChild(price);
    listaAsientos.appendChild(li);
  });

  totalEl.textContent = formatCOP(sum);
  continuarBtn.disabled = selected.length !== paxCount;
}

/* --- Continuar --- */
document.getElementById("continuar").addEventListener("click", ()=>{
  const payload = {
    vuelo: seleccion?.vuelo || null,
    asientos: selected,
    totalAsientos: selected.reduce((a,b)=>a+b.price,0)
  };
  localStorage.setItem("asientos", JSON.stringify(payload));
  alert("Asientos guardados. Continuar a pago/resumen.");
  // Cambia el destino si ya tienes la carpeta de pago:
  // location.href = "../pago_resumen/index.html";
});

init();
