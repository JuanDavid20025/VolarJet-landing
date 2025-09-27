/* ===== VolarJet – Estado de vuelo ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* --- Datos DEMO (reemplaza por tu API cuando quieras) --- */
const AEROPUERTOS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
];

const MOCK = [
  // mismo vuelo, distintas fechas/estados para probar
  { num:"VJ123", o:"BOG", d:"CTG", fecha:"2025-10-05", dep:"08:40", arr:"10:05", gate:"A12", term:"T1", estado:"on-time",  est:"10:05" },
  { num:"VJ123", o:"BOG", d:"CTG", fecha:"2025-10-06", dep:"08:40", arr:"10:05", gate:"A12", term:"T1", estado:"delayed",  est:"10:35" },
  { num:"VJ321", o:"CTG", d:"BOG", fecha:"2025-10-06", dep:"12:00", arr:"13:23", gate:"B04", term:"T2", estado:"on-time",  est:"13:23" },
  { num:"VJ777", o:"BOG", d:"SMR", fecha:"2025-10-08", dep:"20:10", arr:"21:35", gate:"C08", term:"T1", estado:"cancelled", est:"—"   },
  { num:"VJ654", o:"BOG", d:"MDE", fecha:"2025-10-07", dep:"14:05", arr:"15:15", gate:"A02", term:"T1", estado:"on-time",  est:"15:15" },
];

/* --- Inicialización --- */
const list = $("#list");
const hint = $("#hint");

(function init(){
  // Tabs
  $$(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      $$(".tab").forEach(x=>x.classList.remove("tab-active"));
      t.classList.add("tab-active");
      const tab = t.getAttribute("data-tab");
      $("#form-num").classList.toggle("hidden", tab!=="num");
      $("#form-ruta").classList.toggle("hidden", tab!=="ruta");
      list.innerHTML = ""; hint.classList.remove("hidden"); hint.textContent = "Ingresa tu búsqueda para ver el estado de los vuelos.";
    });
  });

  // Selects ruta
  const oSel = $("#f-origen"), dSel = $("#f-destino");
  AEROPUERTOS.forEach(a => {
    oSel.add(new Option(a.name, a.code));
    dSel.add(new Option(a.name, a.code));
  });
  oSel.value = "BOG"; dSel.value = "CTG";

  // Fechas mínimas (hoy)
  const today = new Date().toISOString().slice(0,10);
  $("#f-fecha-num").min = today;
  $("#f-fecha-ruta").min = today;

  // Buscar por número
  $("#btn-buscar-num").addEventListener("click", ()=>{
    const num = ($("#f-numero").value || "").toUpperCase().trim();
    const f   = $("#f-fecha-num").value;
    if(!num || !f){ $("#msg-num").textContent = "Ingresa número y fecha."; return; }
    $("#msg-num").textContent = "";
    const rows = MOCK.filter(x => x.num===num && x.fecha===f);
    render(rows, `Resultados para ${num} · ${fmtFecha(f)}`);
  });

  // Buscar por ruta
  $("#btn-buscar-ruta").addEventListener("click", ()=>{
    const o = $("#f-origen").value, d = $("#f-destino").value, f = $("#f-fecha-ruta").value;
    if(!o || !d || o===d || !f){ $("#msg-ruta").textContent = "Selecciona origen, destino y fecha (distintos)."; return; }
    $("#msg-ruta").textContent = "";
    const rows = MOCK.filter(x => x.o===o && x.d===d && x.fecha===f);
    render(rows, `Vuelos ${o} → ${d} · ${fmtFecha(f)}`);
  });
})();

/* --- Render --- */
function render(rows, subtitle){
  list.innerHTML = "";
  hint.classList.toggle("hidden", !!rows.length);
  if(!rows.length){
    hint.textContent = "No encontramos vuelos para tu búsqueda.";
    return;
  }
  rows.forEach(r=>{
    list.appendChild(card(r, subtitle));
  });
}

function card(v, subtitle){
  const wrap = document.createElement("div");
  wrap.className = "flight";
  const stxt = v.estado === "on-time" ? "A tiempo"
            : v.estado === "delayed" ? "Retrasado"
            : "Cancelado";
  wrap.innerHTML = `
    <div class="head">
      <span class="badge">${v.num}</span>
      <div>
        <div><strong>${v.o} → ${v.d}</strong></div>
        <div class="meta">${subtitle || fmtFecha(v.fecha)}</div>
      </div>
    </div>

    <div class="status ${v.estado}">
      <div class="dot"></div>
      <strong>${stxt}</strong>
      <span class="meta">Salida ${v.dep} · Llegada prog. ${v.arr}${v.est && v.est!==v.arr ? ` · Est. ${v.est}` : ""}</span>
    </div>

    <div class="meta">
      Terminal ${v.term || "—"} · Puerta ${v.gate || "—"}
    </div>

    <div class="cta">
      <button class="btn ghost small" onclick="alert('Notificaciones activadas ✅ (demo)')">🔔 Notificar</button>
      <button class="btn primary small" onclick="location.href='../checkin_web/index.html'">Check-in</button>
    </div>
  `;
  return wrap;
}

/* --- Utils --- */
function fmtFecha(iso){
  if(!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"});
}
