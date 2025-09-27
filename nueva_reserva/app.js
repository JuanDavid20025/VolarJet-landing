/* ===== VolarJet – Nueva reserva (demo) ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

/* === Catálogos simples === */
const AIRPORTS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
];

// Precio base por ruta (ida, por adulto/niño). Si no está, usa default.
const BASE_ROUTE_PRICE = {
  "BOG-CTG": 149900, "CTG-BOG": 149900,
  "BOG-MDE": 119900, "MDE-BOG": 119900,
  "BOG-CLO": 129900, "CLO-BOG": 129900,
  "BOG-SMR": 159900, "SMR-BOG": 159900,
  "MDE-SMR": 139900, "SMR-MDE": 139900,
  "_DEFAULT": 129900
};

(function init(){
  // Popular selects
  const so = $("#origen"), sd = $("#destino");
  AIRPORTS.forEach(a => {
    so.add(new Option(a.name, a.code));
    sd.add(new Option(a.name, a.code));
  });
  so.value = "BOG"; sd.value = "CTG";

  // Fechas
  const today = new Date().toISOString().slice(0,10);
  $("#fecha").min = today;
  $("#fecha").value = today;

  // Horarios iniciales
  renderHorarios();

  // Eventos
  $("#origen").addEventListener("change", renderHorarios);
  $("#destino").addEventListener("change", renderHorarios);
  $("#btn-cotizar").addEventListener("click", cotizar);
  $("#btn-confirmar").addEventListener("click", confirmar);
})();

/* === Horarios de ejemplo por ruta (3 opciones) === */
function renderHorarios(){
  const o = $("#origen").value, d = $("#destino").value;
  const sel = $("#horario"); sel.innerHTML = "";
  const options = horariosParaRuta(o,d);
  options.forEach(h => sel.add(new Option(`${h.dep} – ${h.arr}`, `${h.dep}|${h.arr}`)));
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

/* === Cotizar === */
function cotizar(){
  const o = $("#origen").value, d = $("#destino").value;
  const fecha = $("#fecha").value;
  const cabina = $("#cabina").value;
  const adt = Math.max(1, Number($("#adt").value||1));
  const chd = Math.max(0, Number($("#chd").value||0));
  const inf = Math.max(0, Number($("#inf").value||0));

  const msg = $("#msg"); msg.textContent = "";

  if(!o || !d || o===d){ msg.textContent = "Elige origen y destino distintos."; return; }
  if(!fecha){ msg.textContent = "Selecciona la fecha de salida."; return; }

  // Precio base por pax (adulto/niño = mismo base; infantes sin silla, $0 en demo)
  const baseKey = `${o}-${d}`;
  let base = BASE_ROUTE_PRICE[baseKey] || BASE_ROUTE_PRICE["_DEFAULT"];

  // Modificadores simples (cabina y fin de semana)
  if(cabina === "Premium Economy") base = Math.round(base * 1.35);
  if(cabina === "Business")        base = Math.round(base * 2.10);

  const dow = new Date(fecha).getDay(); // 0=dom
  if(dow===5 || dow===6 || dow===0){ base = Math.round(base * 1.10); } // finde +10%

  const paxBase = base * (adt + chd);
  const iva = Math.round(paxBase * 0.19);
  const total = paxBase + iva;

  // Mostrar
  const rutaTxt = `${o} → ${d}`;
  $("#q-ruta").textContent = rutaTxt + " · " + cabina;
  $("#q-fecha").textContent = new Date(fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"});
  const [dep,arr] = ($("#horario").value || "08:00|09:30").split("|");
  $("#q-vuelo").textContent = `Horario ${dep} – ${arr}`;

  $("#q-base").textContent  = COP(paxBase);
  $("#q-iva").textContent   = COP(iva);
  $("#q-total").textContent = COP(total);

  // Guardar la cotización en memoria temporal (para confirmar)
  const vueloId = "VJ" + String(Math.floor(100 + Math.random()*900));
  window.__quote = {
    o,d, fecha, dep, arr, cabina,
    pax: { adt, chd, inf },
    precios: { base: paxBase, iva, total },
    vueloId
  };

  $("#cotizacion").classList.remove("hidden");
  $("#ok").classList.add("hidden");
}

/* === Confirmar (guardar reserva + orden) === */
function confirmar(){
  if(!window.__quote){ alert("Primero cotiza tu vuelo."); return; }
  const q = window.__quote;

  // Validar contacto mínimo
  const nombre = ($("#c-nombre").value || "").trim();
  const mail   = ($("#c-mail").value   || "").trim();
  if(!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){
    alert("Ingresa al menos nombre y correo válidos para continuar.");
    return;
  }

  const doc = ($("#c-doc").value || "").trim();
  const tel = ($("#c-tel").value || "").trim();

  const pnr = genPNR();
  const reserva = {
    pnr,
    estado: "ACTIVA",
    vuelo: { id: q.vueloId, o: q.o, d: q.d, fecha: q.fecha, dep: q.dep, arr: q.arr },
    total: q.precios.total,
    creada: new Date().toISOString()
  };

  // Guardar en 'reservas'
  const reservas = readJSON("reservas") || [];
  reservas.unshift(reserva);
  writeJSON("reservas", reservas);

  // Guardar 'orden' para facturación y futuras pantallas
  const orden = {
    pnr,
    contacto: { nombre, mail, tel, doc },
    vuelo: { ...reserva.vuelo },
    pax: q.pax,
    cabina: q.cabina,
    totalPagar: q.precios.total
  };
  writeJSON("orden", orden);
  localStorage.setItem("pnr", pnr); // compatibilidad con otras pantallas

  // Mostrar OK
  $("#ok-pnr").textContent = pnr;
  $("#ok").classList.remove("hidden");
  // Scroll suave
  $("#ok").scrollIntoView({behavior:"smooth", block:"center"});
}

/* === Utils === */
function genPNR(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = ""; for(let i=0;i<6;i++){ p += chars[Math.floor(Math.random()*chars.length)]; }
  return p;
}
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
