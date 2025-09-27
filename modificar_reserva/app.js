/* ===== VolarJet – Modificar reserva ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

const AIRPORTS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
];

const BASE_ROUTE_PRICE = {
  "BOG-CTG": 149900, "CTG-BOG": 149900,
  "BOG-MDE": 119900, "MDE-BOG": 119900,
  "BOG-CLO": 129900, "CLO-BOG": 129900,
  "BOG-SMR": 159900, "SMR-BOG": 159900,
  "MDE-SMR": 139900, "SMR-MDE": 139900,
  "_DEFAULT": 129900
};

let original = null; // reserva encontrada
let orden = null;    // orden asociada (si existe)

/* === UI init === */
(function init(){
  // Popular selects de aeropuerto
  const so = $("#origen"), sd = $("#destino");
  AIRPORTS.forEach(a => { so.add(new Option(a.name, a.code)); sd.add(new Option(a.name, a.code)); });

  // Fecha min (hoy)
  const today = new Date().toISOString().slice(0,10);
  $("#fecha").min = today;

  // Eventos
  $("#btn-buscar").addEventListener("click", buscarPNR);
  $("#origen").addEventListener("change", renderHorarios);
  $("#destino").addEventListener("change", renderHorarios);
  $("#fecha").addEventListener("change", ()=>updateQuote(false));
  $("#horario").addEventListener("change", ()=>updateQuote(false));
  $("#cabina").addEventListener("change", ()=>updateQuote(false));
  $("#estado").addEventListener("change", ()=>updateQuote(false));

  $("#btn-recalcular").addEventListener("click", ()=>updateQuote(true));
  $("#btn-guardar").addEventListener("click", guardar);
})();

/* === Buscar === */
function buscarPNR(){
  const pnr = ($("#q-pnr").value||"").trim().toUpperCase();
  const mail = ($("#q-mail").value||"").trim().toLowerCase();
  if(!pnr){ return show("#msg","Escribe el PNR."); }

  const reservas = readJSON("reservas") || [];
  const res = reservas.find(r => String(r.pnr).toUpperCase() === pnr);
  if(!res){ $("#editor").classList.add("hidden"); return show("#msg","No encontramos ese PNR."); }

  // Si piden validar con correo, verifica contra la orden
  const ord = readJSON("orden");
  if(mail && ord && ord.pnr === pnr && String(ord.contacto?.mail||"").toLowerCase() !== mail){
    $("#editor").classList.add("hidden");
    return show("#msg","El correo no coincide con la reserva.");
  }

  original = {...res}; // copia inmutable de referencia
  orden = (ord && ord.pnr === pnr) ? ord : null;

  // Pintar form
  $("#editor").classList.remove("hidden");
  $("#e-pnr").textContent = res.pnr;
  $("#e-fechas").textContent = `Creada: ${fmt(res.creada)} · Última mod: ${fmt(res.actualizada)}`;

  $("#origen").value  = res.vuelo.o;
  $("#destino").value = res.vuelo.d;
  renderHorarios();

  $("#fecha").value = res.vuelo.fecha;
  $("#horario").value = `${res.vuelo.dep}|${res.vuelo.arr}`;
  $("#cabina").value = orden?.cabina || "Economy";
  $("#estado").value = res.estado || "ACTIVA";

  updateQuote(true);
}

/* === Horarios por ruta === */
function renderHorarios(){
  const o = $("#origen").value, d = $("#destino").value;
  const sel = $("#horario"); sel.innerHTML = "";
  horariosParaRuta(o,d).forEach(h => sel.add(new Option(`${h.dep} – ${h.arr}`, `${h.dep}|${h.arr}`)));
  updateQuote(false);
}
function horariosParaRuta(o,d){
  const table = {
    "BOG-CTG":[["08:40","10:05"],["13:20","14:45"],["20:10","21:35"]],
    "BOG-MDE":[["06:10","07:05"],["12:00","12:55"],["19:10","20:05"]],
    "BOG-CLO":[["07:30","08:40"],["14:15","15:25"],["21:00","22:10"]],
    "BOG-SMR":[["09:05","10:35"],["15:20","16:50"],["20:00","21:30"]],
    "MDE-SMR":[["06:50","08:05"],["12:30","13:45"],["18:10","19:25"]],
  };
  const key = `${o}-${d}`;
  const arr = table[key] || [["08:00","09:30"],["13:00","14:30"],["19:00","20:30"]];
  return arr.map(([dep,arr])=>({dep,arr}));
}

/* === Cotización / diferencia === */
function updateQuote(forceShow){
  if(!original) return;
  const o = $("#origen").value, d = $("#destino").value;
  if(!o || !d || o===d){ return show("#msg","Elige origen y destino distintos."); }

  const fecha = $("#fecha").value || original.vuelo.fecha;
  const cabina = $("#cabina").value;
  const [dep,arr] = ($("#horario").value || `${original.vuelo.dep}|${original.vuelo.arr}`).split("|");

  // Precio base (adultos+niños). En demo usamos 1 pax si no hay orden.
  const pax = (orden?.pax?.adt || 1) + (orden?.pax?.chd || 0);
  let baseUnit = BASE_ROUTE_PRICE[`${o}-${d}`] || BASE_ROUTE_PRICE["_DEFAULT"];
  if(cabina === "Premium Economy") baseUnit = Math.round(baseUnit * 1.35);
  if(cabina === "Business")        baseUnit = Math.round(baseUnit * 2.10);
  const dow = new Date(fecha).getDay();
  if([0,5,6].includes(dow)) baseUnit = Math.round(baseUnit * 1.10);
  const base = baseUnit * pax;
  const iva = Math.round(base * 0.19);
  const nuevo = base + iva;

  // UI
  $("#q-ruta").textContent = `${o} → ${d} · ${cabina}`;
  $("#q-fecha").textContent = new Date(fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"});
  $("#q-vuelo").textContent = `Horario ${dep} – ${arr}`;
  $("#q-orig").textContent  = COP(original.total || 0);
  $("#q-nuevo").textContent = COP(nuevo);
  const diff = (nuevo - (original.total||0));
  $("#q-diff").textContent  = (diff===0) ? "Sin diferencia" : (diff>0 ? `Diferencia a pagar: ${COP(diff)}` : `Saldo a favor: ${COP(Math.abs(diff))}`);

  if(forceShow){ /* nada extra */ }

  // Guardar cotiz temporal
  window.__quote = { o,d,fecha,dep,arr,cabina,nuevoTotal:nuevo };
}

/* === Guardar === */
function guardar(){
  if(!original || !window.__quote) return alert("Busca y recalcula antes de guardar.");
  const q = window.__quote;

  // Actualizar reserva en storage
  const reservas = readJSON("reservas") || [];
  const idx = reservas.findIndex(r => String(r.pnr).toUpperCase() === String(original.pnr).toUpperCase());
  if(idx < 0) return alert("La reserva ya no existe. Actualiza la página.");

  reservas[idx] = {
    ...reservas[idx],
    estado: $("#estado").value,
    vuelo: { id: reservas[idx].vuelo.id, o:q.o, d:q.d, fecha:q.fecha, dep:q.dep, arr:q.arr },
    total: q.nuevoTotal,
    actualizada: new Date().toISOString()
  };
  writeJSON("reservas", reservas);

  // Si hay 'orden' y coincide, actualízala también
  const ord = readJSON("orden");
  if(ord && ord.pnr === original.pnr){
    ord.vuelo = { id: reservas[idx].vuelo.id, o:q.o, d:q.d, fecha:q.fecha, dep:q.dep, arr:q.arr };
    ord.cabina = q.cabina;
    ord.totalPagar = q.nuevoTotal;
    writeJSON("orden", ord);
  }

  original = {...reservas[idx]}; // refresca copia
  $("#e-fechas").textContent = `Creada: ${fmt(original.creada)} · Última mod: ${fmt(original.actualizada)}`;
  $("#q-orig").textContent = COP(original.total);
  $("#save-msg").textContent = "Cambios guardados ✅";
  setTimeout(()=> $("#save-msg").textContent="", 2500);
}

/* === Utils === */
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function fmt(iso){ if(!iso) return "—"; const d=new Date(iso); return d.toLocaleString("es-CO",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}); }
function show(sel, text){ const el=$(sel); el.textContent=text; setTimeout(()=> el.textContent="", 3500); }
