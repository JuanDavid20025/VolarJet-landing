/* ===== VolarJet – Mis reservas ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

/* Estructura esperada en localStorage['reservas'] (array):
{
  pnr: "AB12CD",
  estado: "ACTIVA" | "CANCELADA" | "VOLADA",
  vuelo: { id:"VJ123", o:"BOG", d:"CTG", fecha:"2025-10-06", dep:"08:40", arr:"10:05" },
  total: 250000,
  creada: "2025-09-10T12:34:56.000Z"
}
*/

// Init
(function init(){
  // Eventos filtros
  $("#q").addEventListener("input", render);
  $("#f-estado").addEventListener("change", render);
  $("#f-sort").addEventListener("change", render);
  $("#btn-limpiar").addEventListener("click", ()=>{
    $("#q").value = ""; $("#f-estado").value = ""; $("#f-sort").value = "fecha-desc"; render();
  });

  // Importar última compra desde localStorage['orden'] (DEMO)
  $("#btn-importar").addEventListener("click", importarUltimaOrden);

  // Render inicial
  render();
})();

function getReservas(){
  try { return JSON.parse(localStorage.getItem("reservas") || "[]"); }
  catch { return []; }
}

function setReservas(arr){
  localStorage.setItem("reservas", JSON.stringify(arr));
}

function importarUltimaOrden(){
  const orden = JSON.parse(localStorage.getItem("orden") || "{}");
  if(!orden || !orden.vuelo){
    alert("No encontré una compra reciente (orden) para importar.");
    return;
  }
  // Si no existe PNR en orden, reutiliza el de confirmación o genera uno
  const pnr = (orden.pnr) || (localStorage.getItem("pnr")) || genPNR();
  const reserva = {
    pnr,
    estado: "ACTIVA",
    vuelo: orden.vuelo,
    total: Number(orden.totalPagar || 0),
    creada: new Date().toISOString()
  };
  const arr = getReservas();
  // Evitar duplicados por PNR
  if(arr.some(r => String(r.pnr).toUpperCase() === String(pnr).toUpperCase())){
    alert(`La reserva ${pnr} ya existe en tu lista.`);
  } else {
    arr.unshift(reserva);
    setReservas(arr);
    alert(`Reserva ${pnr} importada ✅`);
    render();
  }
}

// Para conectar automáticamente desde PAGO, agrega esto al final del pago exitoso:
// const reservas = JSON.parse(localStorage.getItem("reservas")||"[]");
// reservas.unshift({ pnr, estado:"ACTIVA", vuelo:v, total:totalPagar, creada:new Date().toISOString() });
// localStorage.setItem("reservas", JSON.stringify(reservas));

function render(){
  const list = $("#list");
  const empty = $("#empty");
  const q = ($("#q").value || "").trim().toLowerCase();
  const est = $("#f-estado").value;
  const sort = $("#f-sort").value;

  let rows = getReservas();

  // Derivar estado PROXIMA (vuelos a futuro)
  const today = new Date().toISOString().slice(0,10);
  rows = rows.map(r => {
    const isFuture = r?.vuelo?.fecha && r.vuelo.fecha >= today;
    return { ...r, _isProxima: isFuture && r.estado === "ACTIVA" };
  });

  // Filtro búsqueda
  if(q){
    rows = rows.filter(r => {
      const hay = [
        r.pnr,
        r?.vuelo?.o, r?.vuelo?.d, r?.vuelo?.id,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  // Filtro estado
  if(est){
    if(est === "PROXIMA"){
      rows = rows.filter(r => r._isProxima);
    } else {
      rows = rows.filter(r => r.estado === est);
    }
  }

  // Orden
  rows.sort((a,b)=>{
    if(sort === "fecha-desc") return (a?.vuelo?.fecha || "").localeCompare(b?.vuelo?.fecha || "");
    if(sort === "fecha-asc")  return (b?.vuelo?.fecha || "").localeCompare(a?.vuelo?.fecha || "");
    if(sort === "creada-desc")return (b.creada||"").localeCompare(a.creada||"");
    if(sort === "precio-desc")return (b.total||0) - (a.total||0);
    if(sort === "precio-asc") return (a.total||0) - (b.total||0);
    return 0;
  });

  // Render
  list.innerHTML = "";
  empty.style.display = rows.length ? "none" : "block";

  rows.forEach(r => list.appendChild(card(r)));
}

function card(r){
  const stxt = r._isProxima ? "Próxima" :
               r.estado === "ACTIVA" ? "Activa" :
               r.estado === "CANCELADA" ? "Cancelada" : "Volada";
  const scol = r._isProxima ? "proxima" :
               r.estado === "ACTIVA" ? "activa" :
               r.estado === "CANCELADA" ? "cancelada" : "volada";

  const el = document.createElement("article");
  el.className = "item";
  const ruta = r?.vuelo ? `${r.vuelo.o} → ${r.vuelo.d}` : "—";
  const fecha = r?.vuelo?.fecha ? new Date(r.vuelo.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "—";
  const hora  = r?.vuelo?.dep && r?.vuelo?.arr ? `${r.vuelo.dep} – ${r.vuelo.arr}` : "—";

  el.innerHTML = `
    <div class="header">
      <span class="badge">${r.pnr || "—"}</span>
      <div>
        <div><strong>${ruta}</strong></div>
        <div class="meta">${fecha} · ${hora} · Vuelo ${r?.vuelo?.id || "—"}</div>
      </div>
    </div>

    <div class="status">
      <span class="dot ${scol}"></span>
      <strong>${stxt}</strong>
    </div>

    <div class="meta">
      Total pagado: <span class="price">${COP(r.total || 0)}</span>
    </div>

    <div class="cta">
      <button class="btn ghost small" onclick="verItinerario('${r.pnr}')">Itinerario</button>
      <button class="btn ghost small" onclick="goCheckin('${r.pnr}')">Check-in</button>
      <button class="btn primary small" onclick="goGestion('${r.pnr}')">Gestionar</button>
      <button class="btn small" onclick="cancelar('${r.pnr}')" style="background:#fee2e2;color:#7f1d1d">Cancelar</button>
    </div>
  `;
  return el;
}

/* Acciones */
function goGestion(pnr){
  // Guardamos PNR por conveniencia y vamos a gestionar
  localStorage.setItem("pnr", pnr);
  location.href = "../gestionar_reservas/index.html";
}
function goCheckin(pnr){
  localStorage.setItem("pnr", pnr);
  location.href = "../checkin_web/index.html";
}
function verItinerario(pnr){
  const r = getReservas().find(x => String(x.pnr).toUpperCase() === String(pnr).toUpperCase());
  if(!r){ alert("Reserva no encontrada."); return; }
  alert(`Itinerario ${pnr}\n${r?.vuelo?.o || "—"} → ${r?.vuelo?.d || "—"}\n${r?.vuelo?.fecha || "—"} · ${r?.vuelo?.dep || "—"} – ${r?.vuelo?.arr || "—"}`);
}
function cancelar(pnr){
  const arr = getReservas();
  const idx = arr.findIndex(x => String(x.pnr).toUpperCase() === String(pnr).toUpperCase());
  if(idx < 0){ alert("Reserva no encontrada."); return; }
  if(!confirm(`¿Cancelar la reserva ${pnr}? Recibirás un voucher (demo).`)) return;
  arr[idx].estado = "CANCELADA";
  setReservas(arr);
  render();
}

/* Util */
function genPNR(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = ""; for(let i=0;i<6;i++){ p += chars[Math.floor(Math.random()*chars.length)]; }
  return p;
}
