/* ====== VOLARJET – RESULTADOS (HTML/CSS/JS puros) ====== */

/* --- Datos simulados (puedes reemplazar con respuesta real de tu API) --- */
const MOCK_VUELOS = [
  { id:"VJ321", o:"CTG", d:"BOG", fecha:"2025-10-05", dep:"12:00", arr:"13:23", dur:"1h 23m", nonstop:true,  tarifas:{ Y:139900, Flex:189900, Plus:259900 } },
  { id:"VJ123", o:"BOG", d:"MDE", fecha:"2025-10-07", dep:"08:40", arr:"09:47", dur:"1h 07m", nonstop:true,  tarifas:{ Y:109900, Flex:159900, Plus:229900 } },
  { id:"VJ456", o:"BOG", d:"CTG", fecha:"2025-10-08", dep:"06:10", arr:"07:35", dur:"1h 25m", nonstop:true,  tarifas:{ Y:119900, Flex:169900, Plus:239900 } },
  { id:"VJ654", o:"BOG", d:"SMR", fecha:"2025-10-11", dep:"14:05", arr:"15:55", dur:"1h 50m", nonstop:true,  tarifas:{ Y:129900, Flex:179900, Plus:249900 } },
  { id:"VJ777", o:"BOG", d:"CTG", fecha:"2025-10-08", dep:"20:10", arr:"21:35", dur:"1h 25m", nonstop:false, tarifas:{ Y: 99900, Flex:149900, Plus:219900 } },
];

/* --- Utilidades --- */
function formatCOP(n){
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
}

function qs(id){ return document.getElementById(id); }

/* --- UI refs --- */
const resumen = qs("resumen");
const lista    = qs("lista");
const sinDatos = qs("sin-datos");
const fDirecto = qs("f-directo");
const fDesde   = qs("f-desde");
const fHasta   = qs("f-hasta");
const fMax     = qs("f-max");
const btnLimpiar = qs("btn-limpiar");

/* --- Cargar contexto desde el buscador (si lo guardaste en localStorage) --- */
/*  Desde la pantalla buscar_reserva puedes hacer:
    localStorage.setItem('searchCtx', JSON.stringify({o:'BOG', d:'CTG', fecha:'2025-10-05', pax:{adt:1,chd:0,inf:0}, cabina:'Economy'}));
*/
const ctx = (()=>{
  try { return JSON.parse(localStorage.getItem("searchCtx") || "{}"); }
  catch { return {}; }
})();

function init(){
  // Resumen arriba (usa ctx si existe; si no, texto genérico)
  if(ctx.o && ctx.d && ctx.fecha){
    const paxTxt = ctx.pax ? 
      `${ctx.pax.adt||1} adt${(ctx.pax.adt||1)>1?"s":""}${ctx.pax.chd?`, ${ctx.pax.chd} chd`:""}${ctx.pax.inf?`, ${ctx.pax.inf} inf.`:""}` 
      : "1 adt";
    resumen.textContent = `${ctx.o} → ${ctx.d} • ${new Date(ctx.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"})} • ${paxTxt} • ${ctx.cabina||"Economy"}`;
  } else {
    resumen.textContent = "Ajusta tus filtros o vuelve al buscador para cambiar ruta y fecha.";
  }

  // Eventos filtros
  [fDirecto, fDesde, fHasta, fMax].forEach(el => el.addEventListener("input", render));
  btnLimpiar.addEventListener("click", ()=>{
    fDirecto.checked = true; fDesde.value = ""; fHasta.value = ""; fMax.value = "";
    render();
  });

  render();
}

function aplicarFiltros(list){
  let out = list.slice();

  // Filtrar por ruta/fecha si viene de ctx
  if(ctx.o && ctx.d){
    out = out.filter(v => v.o === ctx.o && v.d === ctx.d);
  }
  if(ctx.fecha){
    out = out.filter(v => v.fecha >= ctx.fecha);
  }

  // directos
  if(fDirecto.checked) out = out.filter(v => v.nonstop);

  // franja horaria
  const d = fDesde.value, h = fHasta.value;
  if(d) out = out.filter(v => v.dep >= d);
  if(h) out = out.filter(v => v.dep <= h);

  // precio máximo
  const mp = Number(fMax.value);
  if(mp > 0){
    out = out.filter(v => Object.values(v.tarifas).some(p => p <= mp));
  }

  return out;
}

function render(){
  const data = aplicarFiltros(MOCK_VUELOS);
  lista.innerHTML = "";
  sinDatos.style.display = data.length ? "none" : "block";

  data.forEach(v=>{
    const card = document.createElement("div");
    card.className = "card flight";

    const head = document.createElement("div");
    head.className = "flight-head";
    head.innerHTML = `
      <div class="flight-logo">✈️</div>
      <div>
        <div><strong>${v.o} → ${v.d}</strong> · ${v.id}</div>
        <div class="flight-meta">${v.dep} – ${v.arr} · ${v.dur} · ${v.nonstop ? "Directo" : "Con escala"}</div>
        <div class="flight-meta">${new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"})}</div>
      </div>
    `;
    card.appendChild(head);

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
    card.appendChild(fares);

    const cta = document.createElement("div");
    cta.className = "cta-col";
    const bSel = document.createElement("button");
    bSel.className = "btn primary";
    bSel.textContent = "Seleccionar";
    bSel.addEventListener("click", ()=> seleccionarVuelo(v));
    cta.appendChild(bSel);

    const extras = document.createElement("div");
    extras.className = "meta-row";
    extras.textContent = "🎒 Extras";
    const poli = document.createElement("div");
    poli.className = "meta-row";
    poli.textContent = "✅ Políticas";
    cta.appendChild(extras); cta.appendChild(poli);

    card.appendChild(cta);

    lista.appendChild(card);
  });
}

function seleccionarTarifa(vuelo, nombre, precio){
  // Guarda selección y avanza al siguiente paso
  localStorage.setItem("seleccion", JSON.stringify({ vuelo, tarifa:nombre, precio }));
  alert(`Tarifa ${nombre} seleccionada para ${vuelo.id} por ${formatCOP(precio)}.`);
  // Ejemplo de navegación:
  // location.href = "../seleccion_asientos/index.html";
}

function seleccionarVuelo(vuelo){
  localStorage.setItem("seleccion", JSON.stringify({ vuelo }));
  alert(`Vuelo ${vuelo.id} seleccionado. Continúa con asientos/extras/pago.`);
  // Ejemplo:
  // location.href = "../seleccion_asientos/index.html";
}

init();

