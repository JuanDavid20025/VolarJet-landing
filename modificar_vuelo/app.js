/* ===== VolarJet – Modificar vuelo (Ops) ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

const AIRPORTS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
  { code:"BAQ", name:"Barranquilla (BAQ)" },
  { code:"PEI", name:"Pereira (PEI)" },
  { code:"BGA", name:"Bucaramanga (BGA)" },
];

const LS_VUELOS   = "vuelos";
const LS_RESERVAS = "reservas";
const LS_ORDEN    = "orden";

let VUELO = null; // vuelo cargado en editor

/* ==== INIT ==== */
(function init(){
  // Popular selects
  [$("#q-o"), $("#q-d"), $("#e-o"), $("#e-d"), $("#n-o"), $("#n-d")].forEach(sel=>{
    AIRPORTS.forEach(a => sel.add(new Option(a.name, a.code)));
  });

  // Fechas mínimas
  const today = new Date().toISOString().slice(0,10);
  $("#q-fecha").min = today; $("#e-fecha").min = today; $("#n-fecha").min = today;

  // Eventos búsqueda
  $("#btn-buscar").addEventListener("click", buscar);
  $("#btn-limpiar").addEventListener("click", limpiarBusqueda);

  // Eventos editor
  $("#btn-guardar").addEventListener("click", guardar);
  $("#btn-eliminar").addEventListener("click", eliminar);
  $("#chk-prop").addEventListener("change", actualizarImpacto);
  $("#chk-recalc").addEventListener("change", actualizarImpacto);

  // Crear
  $("#btn-crear").addEventListener("click", crear);

  // Si no hay vuelos, genera demo
  seedIfEmpty();
})();

/* ==== Buscar ==== */
function buscar(){
  const id = ($("#q-id").value||"").trim().toUpperCase();
  const o  = $("#q-o").value;
  const d  = $("#q-d").value;
  const f  = $("#q-fecha").value;

  const vuelos = readJSON(LS_VUELOS) || [];

  let v = null;
  if(id){
    v = vuelos.find(x => String(x.id).toUpperCase() === id);
  }else if(o && d && f){
    v = vuelos.find(x => x.o===o && x.d===d && x.fecha===f);
  }else{
    return show("#msg","Escribe un ID o selecciona ruta + fecha.");
  }

  if(!v){
    $("#editor").classList.add("hidden");
    $("#crear").classList.remove("hidden");
    // precargar crear
    $("#n-id").value = id || suggId(o,d);
    $("#n-o").value  = o || "BOG";
    $("#n-d").value  = d || "CTG";
    $("#n-fecha").value = f || todayPlus(1);
    $("#n-dep").value = "08:00";
    $("#n-arr").value = "09:30";
    return show("#msg","No se encontró vuelo. Puedes crearlo.");
  }

  VUELO = {...v}; // copiar
  pintarEditor(v);
  $("#crear").classList.add("hidden");
  $("#editor").classList.remove("hidden");
  show("#msg",`Vuelo ${v.id} cargado.`, true);
}

/* ==== Editor ==== */
function pintarEditor(v){
  $("#e-id").value = v.id;
  $("#e-status").textContent = v.estado || "PROGRAMADO";
  $("#e-o").value = v.o; $("#e-d").value = v.d;
  $("#e-fecha").value = v.fecha;
  $("#e-dep").value = v.dep; $("#e-arr").value = v.arr;
  $("#e-estado").value = v.estado || "PROGRAMADO";
  $("#e-modelo").value = v.avion?.modelo || "";
  $("#e-matricula").value = v.avion?.matricula || "";
  $("#e-terminal").value = v.terminal || "";
  $("#e-puerta").value = v.puerta || "";
  $("#p-econ").value = v.cabina?.economy?.precioBase ?? "";
  $("#c-econ").value = v.cabina?.economy?.cupos ?? "";
  $("#p-prem").value = v.cabina?.premium?.precioBase ?? "";
  $("#c-prem").value = v.cabina?.premium?.cupos ?? "";
  $("#p-biz").value  = v.cabina?.business?.precioBase ?? "";
  $("#c-biz").value  = v.cabina?.business?.cupos ?? "";
  $("#e-upd").textContent = "Actualizado " + fmtDateTime(v.actualizado || v.creado || new Date().toISOString());
  actualizarImpacto();
}

function recogerEditor(){
  const v = {
    id: $("#e-id").value.trim().toUpperCase(),
    o: $("#e-o").value, d: $("#e-d").value,
    fecha: $("#e-fecha").value,
    dep: $("#e-dep").value, arr: $("#e-arr").value,
    estado: $("#e-estado").value,
    avion: { modelo: $("#e-modelo").value.trim(), matricula: $("#e-matricula").value.trim() },
    terminal: $("#e-terminal").value.trim(),
    puerta: $("#e-puerta").value.trim(),
    cabina: {
      economy: { precioBase: num($("#p-econ").value), cupos: int($("#c-econ").value) },
      premium: { precioBase: num($("#p-prem").value), cupos: int($("#c-prem").value) },
      business:{ precioBase: num($("#p-biz").value),  cupos: int($("#c-biz").value)  },
    },
    actualizado: new Date().toISOString()
  };
  return v;
}

/* ==== Guardar ==== */
function guardar(){
  if(!VUELO){ return alert("Busca o crea un vuelo primero."); }
  const edited = recogerEditor();

  const vuelos = readJSON(LS_VUELOS) || [];
  const idx = vuelos.findIndex(x => String(x.id).toUpperCase() === VUELO.id.toUpperCase());
  if(idx < 0) return alert("El vuelo ya no existe. Actualiza la página.");

  vuelos[idx] = { ...vuelos[idx], ...edited };
  writeJSON(LS_VUELOS, vuelos);
  VUELO = {...vuelos[idx]};

  // Propagar a reservas si corresponde
  const doProp = $("#chk-prop").checked;
  const doRecalc = $("#chk-recalc").checked;
  let impacted = 0;
  if(doProp || doRecalc){
    const reservas = readJSON(LS_RESERVAS) || [];
    reservas.forEach(r=>{
      if(r?.vuelo?.id === VUELO.id && r?.vuelo?.fecha === VUELO.fecha){
        impacted++;
        if(doProp){
          r.vuelo = { id: VUELO.id, o: VUELO.o, d: VUELO.d, fecha: VUELO.fecha, dep: VUELO.dep, arr: VUELO.arr };
          r.estado = (VUELO.estado === "CANCELADO") ? "CANCELADA" : (r.estado || "ACTIVA");
          r.actualizada = new Date().toISOString();
        }
        if(doRecalc){
          const ord = readJSON(LS_ORDEN);
          // Si hay orden vigente y coincide PNR, usamos su cabina/pax; si no, asumimos 1 pax
          const cab = (ord && ord.vuelo?.id === r.vuelo.id) ? (ord.cabina || "Economy") : "Economy";
          const pax = (ord && ord.vuelo?.id === r.vuelo.id) ? ((ord.pax?.adt||0)+(ord.pax?.chd||0)) : 1;
          const baseUnit = priceByCab(VUELO, cab);
          const base = baseUnit * pax;
          const iva  = Math.round(base * 0.19);
          r.total = base + iva;
          r.actualizada = new Date().toISOString();
        }
      }
    });
    writeJSON(LS_RESERVAS, reservas);
  }

  pintarEditor(VUELO);
  $("#save-msg").textContent = `Guardado ✅ ${impacted? " · Reservas actualizadas: "+impacted : ""}`;
  setTimeout(()=> $("#save-msg").textContent = "", 3000);
}

/* ==== Eliminar ==== */
function eliminar(){
  if(!VUELO) return;
  if(!confirm(`Eliminar vuelo ${VUELO.id}? No borra las reservas, solo el vuelo del catálogo.`)) return;
  const vuelos = readJSON(LS_VUELOS) || [];
  const out = vuelos.filter(x => x.id !== VUELO.id);
  writeJSON(LS_VUELOS, out);
  VUELO = null;
  $("#editor").classList.add("hidden");
  show("#msg","Vuelo eliminado.", true);
}

/* ==== Crear nuevo ==== */
function crear(){
  const id = ($("#n-id").value||"").trim().toUpperCase();
  const o  = $("#n-o").value, d = $("#n-d").value;
  const f  = $("#n-fecha").value;
  const dep= $("#n-dep").value, arr = $("#n-arr").value;
  if(!/^[A-Z]{2}\d{3}$/.test(id)) return show("#new-msg","ID inválido (formato sugerido: VJ123).");
  if(!o || !d || o===d) return show("#new-msg","Elige origen y destino distintos.");
  if(!f || !dep || !arr) return show("#new-msg","Completa fecha y horarios.");

  const vuelos = readJSON(LS_VUELOS) || [];
  if(vuelos.some(x => x.id === id)) return show("#new-msg","Ya existe un vuelo con ese ID.");

  const v = {
    id, o, d, fecha:f, dep, arr,
    estado:"PROGRAMADO",
    avion:{ modelo:"", matricula:"" },
    terminal:"", puerta:"",
    cabina:{
      economy:{ precioBase: 129900, cupos: 150 },
      premium:{ precioBase: 189900, cupos: 24 },
      business:{ precioBase: 329900, cupos: 12 },
    },
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString()
  };

  vuelos.push(v);
  writeJSON(LS_VUELOS, vuelos);
  VUELO = {...v};
  pintarEditor(VUELO);
  $("#crear").classList.add("hidden");
  $("#editor").classList.remove("hidden");
  show("#msg","Vuelo creado ✅", true);
}

/* ==== Impacto reservas ==== */
function actualizarImpacto(){
  if(!VUELO){ $("#impacto").textContent = "Reservas impactadas: 0"; return; }
  const reservas = readJSON(LS_RESERVAS) || [];
  const n = reservas.filter(r => r?.vuelo?.id === VUELO.id && r?.vuelo?.fecha === VUELO.fecha).length;
  $("#impacto").textContent = `Reservas impactadas: ${n}`;
  $("#e-status").textContent = $("#e-estado").value;
}

/* ==== Utilidades ==== */
function priceByCab(vuelo, cab){
  const c = (cab||"Economy").toLowerCase();
  if(c.startsWith("premium")) return Math.max(0, vuelo.cabina?.premium?.precioBase || 0);
  if(c.startsWith("business"))return Math.max(0, vuelo.cabina?.business?.precioBase || 0);
  return Math.max(0, vuelo.cabina?.economy?.precioBase || 0);
}
function todayPlus(days=1){
  const d = new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function suggId(o,d){
  const n = Math.floor(100 + Math.random()*900);
  return "VJ" + String(n);
}
function fmtDateTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("es-CO",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  }catch{ return "—"; }
}
function num(v){ const x = Number(v||0); return isNaN(x)?0:x; }
function int(v){ const x = parseInt(v||0, 10); return isNaN(x)?0:x; }
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch{ return null; } }
function writeJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function show(sel, text, ok=false){ const el=$(sel); el.textContent=text; el.style.color = ok ? "#065f46" : "#b91c1c"; setTimeout(()=>{ el.textContent=""; }, 3500); }

/* ==== Seed data (demo) ==== */
function seedIfEmpty(){
  const vuelos = readJSON(LS_VUELOS) || [];
  if(vuelos.length>0) return;
  const seed = [];
  const routes = [
    ["BOG","CTG","08:40","10:05"],
    ["BOG","MDE","06:10","07:05"],
    ["BOG","CLO","07:30","08:40"],
    ["MDE","SMR","12:30","13:45"],
  ];
  for(let i=0;i<routes.length;i++){
    const [o,d,dep,arr] = routes[i];
    seed.push({
      id: "VJ" + (120+i),
      o,d, fecha: todayPlus(1+i),
      dep, arr, estado:"PROGRAMADO",
      avion:{ modelo:"A320", matricula:"VJ-A320-"+(i+1) },
      terminal:"T2", puerta:"A"+(5+i),
      cabina:{
        economy:{ precioBase: 129900 + i*10000, cupos: 150 },
        premium:{ precioBase: 189900 + i*12000, cupos: 24 },
        business:{ precioBase: 329900 + i*15000, cupos: 12 },
      },
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString()
    });
  }
  writeJSON(LS_VUELOS, seed);
}
