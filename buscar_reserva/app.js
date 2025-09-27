/* ========= VOLARJET – BUSCADOR Y RESULTADOS (HTML/CSS/JS puros) ========= */

/* ---- Datos simulados ---- */
const AEROPUERTOS = [
  { code: "BOG", name: "Bogotá (BOG)" },
  { code: "CTG", name: "Cartagena (CTG)" },
  { code: "MDE", name: "Medellín (MDE)" },
  { code: "SMR", name: "Santa Marta (SMR)" },
  { code: "CLO", name: "Cali (CLO)" },
];

const MOCK_VUELOS = [
  { id: "VJ321", o: "CTG", d: "BOG", fecha: "2025-10-05", dep: "12:00", arr: "13:23", dur: "1h 23m", nonstop: true, tarifas: { Y: 139900, Flex: 189900, Plus: 259900 } },
  { id: "VJ123", o: "BOG", d: "MDE", fecha: "2025-10-07", dep: "08:40", arr: "09:47", dur: "1h 07m", nonstop: true, tarifas: { Y: 109900, Flex: 159900, Plus: 229900 } },
  { id: "VJ654", o: "BOG", d: "SMR", fecha: "2025-10-11", dep: "14:05", arr: "15:55", dur: "1h 50m", nonstop: true, tarifas: { Y: 129900, Flex: 179900, Plus: 249900 } },
];

function formatCOP(n){
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
}

function todayISO(){
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

/* ---- Elementos ---- */
const origenSel = document.getElementById("origen");
const destinoSel = document.getElementById("destino");
const salidaInp = document.getElementById("salida");
const regresoInp = document.getElementById("regreso");
const btnRT = document.getElementById("btn-rt");
const btnOW = document.getElementById("btn-ow");
const swapBtn = document.getElementById("swap");
const buscarBtn = document.getElementById("buscar");
const directosChk = document.getElementById("directos");
const maxPrecioInp = document.getElementById("max-precio");
const promoInp = document.getElementById("promo");
const resumenDiv = document.getElementById("resumen");
const resultadosDiv = document.getElementById("resultados");
const hintP = document.getElementById("hint");

const paxVals = {
  adt: document.getElementById("pax-adt"),
  chd: document.getElementById("pax-chd"),
  inf: document.getElementById("pax-inf"),
};
let pax = { adt: 1, chd: 0, inf: 0 };

const cabinaSel = document.getElementById("cabina");

/* ---- Estado ---- */
let roundTrip = true;

/* ---- Init ---- */
(function init(){
  // aeropuertos
  AEROPUERTOS.forEach(a=>{
    const opt1 = new Option(a.name, a.code);
    const opt2 = new Option(a.name, a.code);
    origenSel.add(opt1);
    destinoSel.add(opt2);
  });
  origenSel.value = "BOG";
  destinoSel.value = "CTG";

  // fechas
  salidaInp.min = todayISO();
  regresoInp.min = todayISO();
  salidaInp.value = todayISO();

  // round-trip por defecto
  setRoundTrip(true);

  // listeners
  btnRT.addEventListener("click", ()=>setRoundTrip(true));
  btnOW.addEventListener("click", ()=>setRoundTrip(false));
  swapBtn.addEventListener("click", swap);
  buscarBtn.addEventListener("click", onBuscar);

  document.querySelectorAll(".pax-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      const key = b.getAttribute("data-key");
      const op  = b.getAttribute("data-op");
      pax[key] = Math.max(key==="adt"?1:0, pax[key] + (op==="+"?1:-1));
      paxVals[key].textContent = String(pax[key]);
    });
  });
})();

function setRoundTrip(v){
  roundTrip = v;
  btnRT.classList.toggle("chip-active", v);
  btnOW.classList.toggle("chip-active", !v);
  regresoInp.disabled = !v;
  if(!v){ regresoInp.value = ""; }
}

function swap(){
  const o = origenSel.value;
  origenSel.value = destinoSel.value;
  destinoSel.value = o;
}

function filtrosValidos(){
  const origen = origenSel.value;
  const destino = destinoSel.value;
  const salida  = salidaInp.value;
  const regreso = regresoInp.value;
  const okRuta = origen && destino && origen !== destino;
  const okFecha = salida && (roundTrip ? !!regreso : true);
  return okRuta && okFecha;
}

function onBuscar(){
  if(!filtrosValidos()){
    alert("Revisa origen/destino y fechas.");
    return;
  }

  hintP.style.display = "none";
  resultadosDiv.innerHTML = "";
  const origen = origenSel.value;
  const destino = destinoSel.value;
  const salida = salidaInp.value;

  // Filtro simple contra MOCK_VUELOS
  let lista = MOCK_VUELOS.filter(v=> v.o===origen && v.d===destino && v.fecha >= salida);
  if(directosChk.checked) lista = lista.filter(v=> v.nonstop);
  const maxP = Number(maxPrecioInp.value);
  if(maxP>0) lista = lista.filter(v => {
    const ps = Object.values(v.tarifas);
    return ps.some(p => p <= maxP);
  });

  // Resumen
  const paxTexto = `${pax.adt} adulto${pax.adt>1?"s":""}` +
    (pax.chd?`, ${pax.chd} niño${pax.chd>1?"s":""}`:"") +
    (pax.inf?`, ${pax.inf} inf.`:"");
  resumenDiv.textContent = `${origen} → ${destino} • ${new Date(salida).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"})} • ${paxTexto} • ${cabinaSel.value}`;

  if(lista.length===0){
    resultadosDiv.innerHTML = `<div class="card">No encontramos vuelos para tu búsqueda. Ajusta fechas o filtros.</div>`;
    return;
  }

  // Render
  lista.forEach(v=>{
    const li = document.createElement("div");
    li.className = "card flight";

    // Columna info
    const head = document.createElement("div");
    head.className = "flight-head";
    head.innerHTML = `
      <div class="flight-logo">✈️</div>
      <div>
        <div><strong>${v.o} → ${v.d}</strong> · ${v.id}</div>
        <div class="flight-meta">${v.dep} – ${v.arr} · ${v.dur} · ${v.nonstop?"Directo":"Con escala"}</div>
        <div class="flight-meta">${new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"})}</div>
      </div>
    `;
    li.appendChild(head);

    // Columna tarifas
    const fares = document.createElement("div");
    fares.className = "fares";
    Object.entries(v.tarifas).forEach(([nombre, precio])=>{
      const btn = document.createElement("button");
      btn.className = "fare";
      btn.innerHTML = `
        <div class="label">${nombre}</div>
        <div class="price">${formatCOP(precio)}</div>
        <div class="detail">Incluye equipaje de mano</div>
      `;
      btn.addEventListener("click", ()=> seleccionarTarifa(v, nombre, precio));
      fares.appendChild(btn);
    });
    li.appendChild(fares);

    // Columna CTA
    const cta = document.createElement("div");
    cta.className = "cta-col";
    const selectBtn = document.createElement("button");
    selectBtn.className = "btn primary";
    selectBtn.textContent = "Seleccionar";
    selectBtn.addEventListener("click", ()=> seleccionarVuelo(v));
    cta.appendChild(selectBtn);

    const extras = document.createElement("div");
    extras.className = "meta-row";
    extras.textContent = "🎒 Extras";
    const politicas = document.createElement("div");
    politicas.className = "meta-row";
    politicas.textContent = "✅ Políticas";
    cta.appendChild(extras);
    cta.appendChild(politicas);

    li.appendChild(cta);

    resultadosDiv.appendChild(li);
  });
}

/* ---- Acciones seleccion ---- */
function seleccionarTarifa(vuelo, nombre, precio){
  alert(`Seleccionaste tarifa ${nombre} en vuelo ${vuelo.id} por ${formatCOP(precio)}.`);
  // Aquí puedes navegar: window.location.href = "detalle.html?pnr=..."; o guardar en localStorage
}

function seleccionarVuelo(vuelo){
  alert(`Vuelo ${vuelo.id} seleccionado. Ahora iríamos a Detalle/Asientos/Pago.`);
}
