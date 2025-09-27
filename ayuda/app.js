/* ===== VolarJet – Centro de ayuda ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const dlg = $("#dlg");

const ARTICLES = [
  // COMPRAS
  { id:"pagos-medios", cat:"compras",  title:"¿Qué medios de pago aceptan?", tags:["pagos","tarjetas","bancos"], body:`
    <p>Aceptamos tarjetas débito y crédito nacionales e internacionales (Visa, Mastercard, Amex), PSE y pagos en efectivo en puntos aliados (demo).</p>
    <h4>Recomendaciones</h4>
    <ul><li>Verifica el cupo y habilita compras por internet.</li><li>Si hay rechazo, intenta con otro medio o contacta a tu banco.</li></ul>
  `, cta:{label:"Ir a ofertas", link:"../ofertas/index.html"} },

  { id:"reembolsos", cat:"compras",  title:"¿Cómo solicito reembolso o voucher?", tags:["reembolso","voucher","cancelar"], body:`
    <p>Según tu tarifa: <strong>Plus</strong> es flexible; <strong>Flex</strong> tiene 1 cambio sin costo + diferencia; <strong>Y</strong> aplica penalidad.</p>
    <p>Para solicitarlo, ingresa a <em>Gestionar reservas</em> con tu PNR y apellido.</p>
  `, cta:{label:"Gestionar reserva", link:"../gestionar_reservas/index.html"} },

  // EQUIPAJE
  { id:"equipaje-medidas", cat:"equipaje", title:"Medidas y peso del equipaje", tags:["equipaje","maleta","peso"], body:`
    <p>Cabina: 1 pieza de mano hasta 10 kg (55×35×25 cm) + artículo personal pequeño (demo). Bodega: 23 kg y 158 cm lineales.</p>
    <div class="note">Exceso de peso o tamaño puede generar cobros adicionales en aeropuerto.</div>
  `, cta:{label:"Añadir equipaje", link:"../extras_servicios/index.html"} },

  // CAMBIOS
  { id:"cambios", cat:"cambios", title:"Cambios de fecha y hora", tags:["cambio","penalidad","tarifa"], body:`
    <p>Puedes cambiar fecha/hora desde <em>Gestionar reservas</em>. Se cobra la diferencia tarifaria y, según tarifa, puede aplicar penalidad.</p>
    <p>Ventana sin multa: hasta 24h antes en Flex/Plus (demo).</p>
  `, cta:{label:"Gestionar reserva", link:"../gestionar_reservas/index.html"} },

  // CHECK-IN
  { id:"checkin", cat:"checkin", title:"Check-in web y pase de abordar", tags:["check-in","boarding pass","apis"], body:`
    <p>Disponible desde 48h antes de la salida. Completa datos APIS, selecciona asiento y descarga tu pase de abordar.</p>
  `, cta:{label:"Hacer check-in", link:"../checkin_web/index.html"} },

  // MASCOTAS
  { id:"mascotas", cat:"mascotas", title:"Viajar con mascotas", tags:["mascotas","cabina","bodega"], body:`
    <p>Mascotas en cabina hasta 8 kg (kennel blando 40×30×20 cm). Cupos limitados por vuelo; suj. a disponibilidad.</p>
    <p>En bodega: consulta requisitos y razas restringidas.</p>
  `, cta:{label:"Ver requisitos", link:"../servicios/index.html"} },

  // FACTURACIÓN
  { id:"facturacion", cat:"facturacion", title:"Descargar factura electrónica", tags:["factura","cufe","pnr"], body:`
    <p>Ingresa tu <strong>PNR</strong> y el <strong>correo</strong> de compra en la página de facturación. Si la compra es válida, podrás imprimir o guardar PDF.</p>
  `, cta:{label:"Facturación", link:"../facturacion/index.html"} },
];

let STATE = { q:"", cat:"" };

/* ===== Init ===== */
(function init(){
  // Chips / categorías
  $$(".chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      $$(".chip").forEach(x=>x.classList.remove("chip-active"));
      chip.classList.add("chip-active");
      STATE.cat = chip.getAttribute("data-cat") || "";
      render();
    });
  });
  $$(".cat").forEach(c=>{
    c.addEventListener("click", ()=>{
      const cat = c.getAttribute("data-cat");
      $$(".chip").forEach(x=>x.classList.remove("chip-active"));
      document.querySelector(`.chip[data-cat="${cat}"]`)?.classList.add("chip-active");
      STATE.cat = cat; render(); window.scrollTo({top: document.querySelector(".results-head").offsetTop-80, behavior:"smooth"});
    });
  });

  // Búsqueda
  $("#btn-search").addEventListener("click", doSearch);
  $("#q").addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); doSearch(); } });

  render(); // estado inicial
})();

function doSearch(){
  STATE.q = ($("#q").value || "").trim().toLowerCase();
  render();
}

/* ===== Render ===== */
function render(){
  const box = $("#results"), empty = $("#empty"), count = $("#count");
  let rows = ARTICLES.filter(a => (!STATE.cat || a.cat===STATE.cat));

  if(STATE.q){
    rows = rows.filter(a => (a.title+" "+a.tags.join(" ")+" "+strip(a.body)).toLowerCase().includes(STATE.q));
  }

  // Orden simple: por relevancia (título incluye query) y luego alfabético
  if(STATE.q){
    const q = STATE.q;
    rows.sort((a,b)=>{
      const as = a.title.toLowerCase().includes(q) ? -1 : 0;
      const bs = b.title.toLowerCase().includes(q) ? -1 : 0;
      return (as - bs) || a.title.localeCompare(b.title);
    });
  }else{
    rows.sort((a,b)=> a.title.localeCompare(b.title));
  }

  box.innerHTML = "";
  empty.style.display = rows.length ? "none" : "block";
  count.textContent = `${rows.length} resultado${rows.length===1?"":"s"}`;

  rows.forEach(a => box.appendChild(card(a)));
}

function card(a){
  const el = document.createElement("article");
  el.className = "item";
  el.innerHTML = `
    <div><strong>${a.title}</strong></div>
    <div class="meta">${catLabel(a.cat)}</div>
    <div class="tags">${a.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    <div><button class="btn ghost" data-open="${a.id}">Leer artículo</button>
         <button class="btn primary" data-cta="${a.id}">${a.cta?.label || "Abrir"}</button>
    </div>
  `;
  el.querySelector(`[data-open="${a.id}"]`).addEventListener("click", ()=> openArticle(a.id));
  el.querySelector(`[data-cta="${a.id}"]`).addEventListener("click", ()=>{
    if(a.cta?.link) location.href = a.cta.link;
    else openArticle(a.id);
  });
  return el;
}

/* ===== Modal artículo ===== */
function openArticle(id){
  const a = ARTICLES.find(x => x.id===id);
  if(!a) return;
  $("#dlg-title").textContent = a.title;
  $("#dlg-body").innerHTML = a.body;
  const ctaBtn = $("#dlg-cta");
  ctaBtn.textContent = a.cta?.label || "Cerrar";
  ctaBtn.onclick = ()=> {
    if(a.cta?.link) location.href = a.cta.link;
    else dlg.close();
  };
  dlg.showModal();
}

/* ===== Utils ===== */
function strip(html){
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
function catLabel(c){
  return c==="compras" ? "Compras y pagos"
       : c==="equipaje" ? "Equipaje"
       : c==="cambios" ? "Cambios y cancelaciones"
       : c==="checkin" ? "Check-in y abordaje"
       : c==="mascotas" ? "Mascotas"
       : c==="facturacion" ? "Facturación"
       : "General";
}
