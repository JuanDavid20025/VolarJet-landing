/* ===== VolarJet – Servicios ===== */
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));

/* Cat: viaje | gestion | soporte */
const SERVICES = [
  // VIAJE
  { id:"equipaje", cat:"viaje", ico:"🧳", titulo:"Equipaje", desc:"Medidas, franquicias, costos por pieza adicional y artículos restringidos.", cta:[
      {label:"Ver políticas", action:()=>openFAQ("faq-equipaje")},
      {label:"Añadir equipaje", link:"../extras_servicios/index.html"}
    ]},
  { id:"checkin", cat:"viaje", ico:"🛄", titulo:"Check-in web", desc:"Disponible desde 48h antes. Descarga tu pase de abordar.", cta:[
      {label:"Hacer check-in", link:"../checkin_web/index.html"}
    ]},
  { id:"mascotas", cat:"viaje", ico:"🐾", titulo:"Viajar con mascotas", desc:"Requisitos de kennels, cupos en cabina y bodega, y certificados veterinarios.", cta:[
      {label:"Requisitos", action:()=>openFAQ("faq-mascotas")}
    ]},
  { id:"asistencia", cat:"viaje", ico:"♿", titulo:"Asistencia especial", desc:"Sillas de ruedas, acompañamiento de menores, condiciones médicas.", cta:[
      {label:"Solicitar asistencia", action:()=>openFAQ("faq-asistencia")}
    ]},
  // GESTIÓN
  { id:"cambios", cat:"gestion", ico:"🔄", titulo:"Cambios y cancelaciones", desc:"Opciones según tu tarifa (Y, Flex, Plus) y ventanas sin multa.", cta:[
      {label:"Gestionar reserva", link:"../gestionar_reservas/index.html"}
    ]},
  { id:"reembolsos", cat:"gestion", ico:"💸", titulo:"Reembolsos y vouchers", desc:"Cuándo aplica reembolso, cómo se emite un voucher y vigencias.", cta:[
      {label:"Solicitar", action:()=>openFAQ("faq-reembolsos")}
    ]},
  { id:"estado", cat:"gestion", ico:"🛫", titulo:"Estado de vuelo", desc:"Consulta salidas/llegadas, puerta, terminal y retrasos.", cta:[
      {label:"Ver estado", link:"../estado_vuelo/index.html"}
    ]},
  // SOPORTE
  { id:"facturacion", cat:"soporte", ico:"🧾", titulo:"Facturación electrónica", desc:"Descarga tu factura con número de pedido o PNR.", cta:[
      {label:"Descargar factura", action:()=>openFAQ("faq-factura")}
    ]},
  { id:"contacto", cat:"soporte", ico:"💬", titulo:"Contacto 24/7", desc:"Chat, WhatsApp y correo para soporte antes y después del viaje.", cta:[
      {label:"Ver canales", action:()=>openFAQ("faq-contacto")}
    ]},
  { id:"seguro", cat:"viaje", ico:"🛡️", titulo:"Seguro de viaje", desc:"Coberturas médica, equipaje y demoras; planes Básico y Full.", cta:[
      {label:"Contratar", link:"../extras_servicios/index.html"}
    ]},
];

const FAQ = [
  { id:"faq-equipaje", q:"¿Cuánto cuesta añadir maleta de 23 kg?", a:"En extras cuesta $60.000 por trayecto y pasajero (demo). Límites: 158 cm lineales. Exceso se cobra en aeropuerto." },
  { id:"faq-mascotas", q:"¿Puedo viajar con mascota en cabina?", a:"Sí, hasta 8 kg incluyendo kennel blando de 40×30×20 cm. Cupos limitados por vuelo." },
  { id:"faq-asistencia", q:"¿Cómo solicito silla de ruedas o acompañamiento?", a:"Desde Gestión o en el momento de la compra. Mínimo 24h antes del vuelo." },
  { id:"faq-reembolsos", q:"¿Cuándo aplica reembolso?", a:"Depende de la tarifa. Plus: flexible; Y/Flex: sujeto a penalidad. En involuntarios (cancelación/retraso) aplica reembolso total." },
  { id:"faq-factura", q:"¿Cómo descargo mi factura electrónica?", a:"Ingresa tu PNR y correo en la sección de facturación (próximamente en el flujo). Por ahora, solicita por soporte." },
  { id:"faq-contacto", q:"¿Cuál es el WhatsApp de soporte?", a:"+57 300 000 0000 (demo). También correo soporte@volarjet.com y chat web." },
];

const cards = $("#cards");
const hint  = $("#hint");
const faqBox = $("#faq");

(function init(){
  // Chips de categoría
  $$(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
      $$(".chip").forEach(x=>x.classList.remove("chip-active"));
      c.classList.add("chip-active");
      render();
    });
  });

  // Buscador
  $("#q").addEventListener("input", render);

  // Render inicial
  render();
  renderFAQ();
})();

function render(){
  const q = ($("#q").value || "").toLowerCase().trim();
  const cat = document.querySelector(".chip-active")?.getAttribute("data-cat") || "";

  let rows = SERVICES.filter(s => (!cat || s.cat===cat));
  if(q){
    rows = rows.filter(s =>
      (s.titulo + " " + s.desc).toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }

  cards.innerHTML = "";
  hint.style.display = rows.length ? "none" : "block";

  rows.forEach(s => cards.appendChild(card(s)));
}

function card(s){
  const el = document.createElement("article");
  el.className = "card svc";
  el.innerHTML = `
    <div class="svc-head">
      <div class="svc-ico">${s.ico}</div>
      <div>
        <strong>${s.titulo}</strong>
        <div class="svc-meta">${catLabel(s.cat)}</div>
      </div>
    </div>
    <div>${s.desc}</div>
    <div class="svc-cta">${s.cta.map(btnHTML).join("")}</div>
  `;
  // Bind acciones
  el.querySelectorAll("[data-link]").forEach(b=>{
    b.addEventListener("click", ()=> location.href = b.getAttribute("data-link"));
  });
  el.querySelectorAll("[data-action]").forEach(b=>{
    b.addEventListener("click", ()=> {
      const id = b.getAttribute("data-action");
      openFAQ(id);
      // Scroll a la sección FAQ
      document.querySelector(".card + .card")?.scrollIntoView({behavior:"smooth"});
    });
  });
  return el;
}

function btnHTML(c){
  if(c.link)   return `<button class="btn primary" data-link="${c.link}">${c.label}</button>`;
  if(c.action) return `<button class="btn ghost" data-action="${c.action}">${c.label}</button>`;
  return "";
}

function catLabel(c){
  return c==="viaje" ? "Viaje" : c==="gestion" ? "Gestión" : "Soporte";
}

/* FAQ */
function renderFAQ(){
  faqBox.innerHTML = "";
  FAQ.forEach(item=>{
    const el = document.createElement("div");
    el.className = "acc";
    el.id = item.id;
    el.innerHTML = `
      <div class="acc-sum">
        <strong>${item.q}</strong>
        <span>＋</span>
      </div>
      <div class="acc-body">${item.a}</div>
    `;
    el.querySelector(".acc-sum").addEventListener("click", ()=>{
      el.classList.toggle("open");
    });
    faqBox.appendChild(el);
  });
}

function openFAQ(id){
  const el = document.getElementById(id);
  if(!el) return;
  if(!el.classList.contains("open")) el.classList.add("open");
}
