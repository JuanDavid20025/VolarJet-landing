/* ===== VolarJet – Ofertas ===== */
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

const AEROPUERTOS = [
  { code:"BOG", name:"Bogotá (BOG)" },
  { code:"MDE", name:"Medellín (MDE)" },
  { code:"CTG", name:"Cartagena (CTG)" },
  { code:"CLO", name:"Cali (CLO)" },
  { code:"SMR", name:"Santa Marta (SMR)" },
];

const OFERTAS = [
  { id:1, tipo:"promo",  o:"BOG", d:"CTG", titulo:"Bogotá → Cartagena",   precio:119900, antes:189900, off:37, vence:"2025-10-10", tags:["Solo ida","Equipaje de mano"], code:"VJVERDE" },
  { id:2, tipo:"bank",   o:"BOG", d:"MDE", titulo:"Bogotá → Medellín",    precio:109900, antes:159900, off:31, vence:"2025-10-12", tags:["Tarjeta Banco X","3 MSI"], code:"BANCOX10" },
  { id:3, tipo:"promo",  o:"MDE", d:"SMR", titulo:"Medellín → Sta. Marta",precio:129900, antes:209900, off:38, vence:"2025-10-09", tags:["Vuelo directo"], code:"VJVERDE" },
  { id:4, tipo:"last",   o:"BOG", d:"CLO", titulo:"Bogotá → Cali",        precio:99900,  antes:149900, off:33, vence:"2025-09-30", tags:["Último minuto"], code:"LASTCLO" },
  { id:5, tipo:"promo",  o:"CTG", d:"BOG", titulo:"Cartagena → Bogotá",   precio:139900, antes:199900, off:30, vence:"2025-10-15", tags:["Incluye cambio"], code:"VJVERDE" },
  { id:6, tipo:"bank",   o:"CLO", d:"BOG", titulo:"Cali → Bogotá",        precio:114900, antes:179900, off:36, vence:"2025-10-05", tags:["Tarjeta Banco Y"], code:"BANCOY12" },
];

const cards = $("#cards");
const hint  = $("#hint");

(function init(){
  // Selects
  const so = $("#f-origen"), sd = $("#f-dest");
  so.add(new Option("Todos", ""));
  sd.add(new Option("Todos", ""));
  AEROPUERTOS.forEach(a => {
    so.add(new Option(a.name, a.code));
    sd.add(new Option(a.name, a.code));
  });

  // Eventos
  ["f-origen","f-dest","f-tipo","f-sort"].forEach(id=>{
    $("#"+id).addEventListener("change", render);
  });
  $("#btn-limpiar").addEventListener("click", ()=>{
    so.value = ""; sd.value=""; $("#f-tipo").value=""; $("#f-sort").value="mejor"; render();
  });

  render();
})();

function render(){
  const fo = $("#f-origen").value;
  const fd = $("#f-dest").value;
  const ft = $("#f-tipo").value;
  const sort = $("#f-sort").value;

  let list = OFERTAS.filter(x =>
    (!fo || x.o===fo) && (!fd || x.d===fd) && (!ft || x.tipo===ft)
  );

  if(sort === "mejor")   list.sort((a,b)=> b.off - a.off);
  if(sort === "precio")  list.sort((a,b)=> a.precio - b.precio);
  if(sort === "reciente")list.sort((a,b)=> new Date(b.vence) - new Date(a.vence));

  cards.innerHTML = "";
  hint.style.display = list.length ? "none" : "block";

  list.forEach(x => cards.appendChild(card(x)));
}

function card(x){
  const el = document.createElement("article");
  el.className = "card offer";
  el.innerHTML = `
    <div class="offer-head">
      <strong>${x.titulo}</strong>
      <span class="badge">${x.off}% OFF</span>
    </div>
    <div class="offer-meta">${x.o} → ${x.d} · Vence ${fmtFecha(x.vence)}</div>
    <div>
      <span class="offer-price">${COP(x.precio)}</span>
      <span class="offer-cut">${COP(x.antes)}</span>
    </div>
    <div class="offer-footer">
      <div class="tags">${x.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div>
        <button class="btn ghost" onclick="aplicarCupon('${x.code}')">Usar ${x.code}</button>
        <button class="btn primary" onclick="irAReserva('${x.o}','${x.d}')">Reservar</button>
      </div>
    </div>
  `;
  return el;
}

function fmtFecha(iso){
  return new Date(iso).toLocaleDateString("es-CO",{day:"2-digit",month:"short"});
}

/* Acciones */
function aplicarCupon(code){
  localStorage.setItem("promoCode", code);
  alert(`Cupón ${code} aplicado. Lo verás en el paso de pago.`);
  // Si usas la pantalla de pago: lee localStorage.getItem('promoCode') y auto-aplica
}

function irAReserva(o,d){
  // Guarda contexto mínimo y lleva al buscador con ruta prefijada
  const ctx = { o, d, fecha: new Date().toISOString().slice(0,10), pax:{adt:1,chd:0,inf:0}, cabina:"Economy" };
  localStorage.setItem("searchCtx", JSON.stringify(ctx));
  location.href = "../buscar_reserva/index.html";
}
