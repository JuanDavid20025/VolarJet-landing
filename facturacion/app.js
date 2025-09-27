/* ===== VolarJet – Facturación electrónica ===== */
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

const msg = $("#msg");
const wrap = $("#factura-wrap");
$("#btn-buscar").addEventListener("click", onBuscar);
$("#btn-mail").addEventListener("click", ()=> alert("Factura enviada por correo (demo)"));

function onBuscar(){
  const pnrIn = ($("#q-pnr").value || "").trim().toUpperCase();
  const mailIn= ($("#q-mail").value || "").trim().toLowerCase();
  if(!pnrIn || !mailIn){ msg.textContent = "Ingresa PNR y correo."; return; }

  // Datos “servidor” (DEMO)
  const orden     = JSON.parse(localStorage.getItem("orden") || "{}");       // total, contacto, pnr, vuelo...
  const seleccion = JSON.parse(localStorage.getItem("seleccion") || "{}");   // tarifa, precio, vuelo
  const extras    = JSON.parse(localStorage.getItem("extras") || "{}");      // extras.totals.total
  const asientos  = JSON.parse(localStorage.getItem("asientos") || "{}");    // asientos.totalAsientos
  const pnrStore  = (orden?.pnr) || localStorage.getItem("pnr") || "ABC123";
  const mailStore = (orden?.contacto?.mail || "demo@volarjet.com").toLowerCase();

  if(pnrIn !== String(pnrStore).toUpperCase()){ msg.textContent = "No encontramos una compra para ese PNR."; return; }
  if(mailIn !== mailStore){ msg.textContent = "El correo no coincide con la compra."; return; }

  msg.textContent = "";
  renderFactura({ orden, seleccion, extras, asientos, pnr: pnrStore, mail: mailStore });
}

function renderFactura({orden, seleccion, extras, asientos, pnr, mail}){
  wrap.classList.remove("hidden");

  // Encabezado
  $("#inv-nro").textContent = genConsecutivo();
  $("#inv-fecha").textContent = new Date().toLocaleString("es-CO");
  $("#inv-pnr").textContent = String(pnr).toUpperCase();

  // Cliente
  const nombre = orden?.contacto?.nombre || "Pasajero Demo";
  const doc    = orden?.contacto?.doc || "CC —";
  $("#cli-nom").textContent = nombre;
  $("#cli-mail").textContent= mail;
  $("#cli-doc").textContent = doc;

  // Vuelo
  const v = orden?.vuelo || seleccion?.vuelo || {};
  const ruta = v.o && v.d ? `${v.o} → ${v.d}` : "—";
  const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO",{weekday:"long",day:"2-digit",month:"short"}) : "—";
  const hora = v.dep && v.arr ? `${v.dep} – ${v.arr}` : "—";
  $("#inv-vuelo").textContent = v.id || "—";
  $("#inv-ruta").textContent  = ruta;
  $("#inv-salida").textContent= `${fecha} · ${hora}`;

  // Items
  const tbody = $("#inv-items"); tbody.innerHTML = "";
  const pax = orden?.pax || { adt:1, chd:0, inf:0 };
  const paxCount = (pax.adt||1)+(pax.chd||0);
  const precioBase = Number(seleccion?.precio || 0);
  const totalTarifa = precioBase * paxCount;

  const totalAsientos = Number(asientos?.totalAsientos || 0);
  const totalExtras   = Number(extras?.totals?.total || 0);

  addItem(tbody, `Tarifa aérea (${paxCount} pasajero/s)`, paxCount, precioBase, totalTarifa);
  if(totalAsientos>0) addItem(tbody, "Selección de asientos", 1, totalAsientos, totalAsientos);
  if(totalExtras>0)   addItem(tbody, "Extras de viaje", 1, totalExtras, totalExtras);

  // Totales (base + IVA 19%)
  const base = totalTarifa + totalAsientos + totalExtras;
  const iva  = Math.round(base * 0.19);
  const total= base + iva;
  $("#sum-base").textContent  = COP(base);
  $("#sum-iva").textContent   = COP(iva);
  $("#sum-total").textContent = COP(total);
}

function addItem(tbody, desc, cant, unit, subtotal){
  const row = document.createElement("div");
  row.innerHTML = `
    <div>${desc}</div>
    <div class="num">${cant}</div>
    <div class="num">${COP(unit)}</div>
    <div class="num">${COP(subtotal)}</div>
  `;
  tbody.appendChild(row);
}

function genConsecutivo(){
  const n = Math.floor(Math.random()*900000)+100000;
  return "FVJ-" + n;
}
