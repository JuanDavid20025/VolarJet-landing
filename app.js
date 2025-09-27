/* ===== VolarJet – Check-in web ===== */
const $ = (sel,root=document)=>root.querySelector(sel);
const $all = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

/* Simulamos “servidor”: la reserva viene de localStorage creada en pago */
const orden     = JSON.parse(localStorage.getItem("orden") || "{}");       // total, pax, cabina, vuelo, contacto, pnr? (opcional)
const asientos  = JSON.parse(localStorage.getItem("asientos") || "{}");    // asientos seleccionados
const seleccion = JSON.parse(localStorage.getItem("seleccion") || "{}");   // tarifa, precio, vuelo

/* ------- Paso 1: Buscar ------- */
const stepFind = $("#step-find");
const findPNR  = $("#find-pnr");
const findLN   = $("#find-lastname");
const findMsg  = $("#find-msg");
$("#btn-buscar").addEventListener("click", onFind);

function onFind(){
  const pnr = (findPNR.value || "").trim().toUpperCase();
  const ln  = (findLN.value || "").trim().toUpperCase();

  // En producción: consulta API con pnr + lastname
  const storedPNR = (orden?.pnr) || (localStorage.getItem("pnr") || "").toUpperCase();
  const okPNR = pnr ? pnr : storedPNR || "ABC123"; // demo: aceptar si deja vacío y tenemos orden
  const titular = (orden?.contacto?.nombre || "Pasajero Demo").split(" ").slice(-1)[0].toUpperCase();

  if(!okPNR){
    findMsg.textContent = "Ingresa tu PNR.";
    return;
  }
  if(ln && ln !== titular){
    findMsg.textContent = "Apellido no coincide con el titular.";
    return;
  }

  // “Reserva encontrada”
  findMsg.textContent = "Reserva encontrada ✅";
  goStepAPIS();
}

/* ------- Paso 2: APIS ------- */
const stepAPIS = $("#step-apis");
const apisInputs = {
  nombres: $("#apis-nombres"),
  apellidos: $("#apis-apellidos"),
  tipo: $("#apis-tipo"),
  doc: $("#apis-doc"),
  nac: $("#apis-nac"),
  nacn: $("#apis-nacn"),
  emgNombre: $("#emg-nombre"),
  emgTel: $("#emg-tel")
};
$("#chk-declaracion").addEventListener("change", validateAPIS);
$all("#step-apis input, #step-apis select").forEach(el=> el.addEventListener("input", validateAPIS));
$("#btn-cont-apis").addEventListener("click", goStepSeat);

function goStepAPIS(){
  stepFind.classList.add("hidden");
  stepAPIS.classList.remove("hidden");

  // Prefill con datos del pago si existen
  const nombrePago = (orden?.contacto?.nombre || "").trim();
  if(nombrePago){
    const parts = nombrePago.split(" ");
    apisInputs.nombres.value   = parts.slice(0, -1).join(" ") || parts[0];
    apisInputs.apellidos.value = parts.slice(-1)[0] || "";
  }
  apisInputs.nacn.value = "Colombia";
  validateAPIS();
}

function validateAPIS(){
  const required = ["nombres","apellidos","doc","nac","nacn","emgNombre","emgTel"];
  const okReq = required.every(k => (apisInputs[k].value || "").trim().length > 1);
  const okDec = $("#chk-declaracion").checked;
  $("#btn-cont-apis").disabled = !(okReq && okDec);
}

/* ------- Paso 3: Asiento ------- */
const stepSeat = $("#step-seat");
const seatCurrent = $("#seat-current");
const seatChooser = $("#seat-chooser");
$("#btn-guardar-seat").addEventListener("click", saveSeat);

function goStepSeat(){
  stepAPIS.classList.add("hidden");
  stepSeat.classList.remove("hidden");

  // Asiento actual desde selección/ asientos (primer pax)
  const seatNow = (asientos?.asientos?.[0]?.id) || null;
  seatCurrent.textContent = `Actual: ${seatNow || "—"}`;

  // Llenar combo con opciones disponibles demo (filas 1..30, cols A..F)
  const COLS = ["A","B","C","D","E","F"];
  const current = seatNow || "";
  seatChooser.innerHTML = "";
  for(let r=1; r<=30; r++){
    for(const c of COLS){
      const id = `${r}${c}`;
      const opt = new Option(id, id, false, id===current);
      seatChooser.add(opt);
    }
  }
}

function saveSeat(){
  const seat = seatChooser.value;
  // Guardamos el asiento del primer pasajero (demo)
  const arr = (asientos?.asientos || []);
  if(arr.length){
    arr[0].id = seat;
  }else{
    arr.push({ id: seat, type:"base", price: 0 });
  }
  const payload = { ...asientos, asientos: arr };
  localStorage.setItem("asientos", JSON.stringify(payload));
  seatCurrent.textContent = `Actual: ${seat}`;
  goStepBoarding();
}

/* ------- Paso 4: Boarding pass ------- */
const stepBP = $("#step-bp");
$("#btn-finalizar").addEventListener("click", ()=>{
  alert("Check-in completado. ¡Buen viaje!");
  // location.href = "../confirmacion_reserva/index.html";
});

function goStepBoarding(){
  stepSeat.classList.add("hidden");
  stepBP.classList.remove("hidden");

  const v = (orden?.vuelo) || (seleccion?.vuelo) || {};
  const seat = (JSON.parse(localStorage.getItem("asientos")||"{}")?.asientos?.[0]?.id) || "—";
  const pnr = (orden?.pnr) || (localStorage.getItem("pnr")) || "ABC123";

  const nombre = `${apisInputs.nombres.value.trim()} ${apisInputs.apellidos.value.trim()}`.trim() || (orden?.contacto?.nombre || "Pasajero(a)");

  $("#bp-nombre").textContent = nombre;
  $("#bp-vuelo").textContent  = v.id || "—";
  $("#bp-origen").textContent = v.o || "—";
  $("#bp-dest").textContent   = v.d || "—";
  $("#bp-salida").textContent = v.dep || "—";
  $("#bp-seat").textContent   = seat;
  $("#bp-pnr").textContent    = (pnr+"").toUpperCase();

  // Persistimos “check-in realizado”
  const checkin = {
    pnr: (pnr+"").toUpperCase(),
    pasajero: { nombre, doc: apisInputs.doc.value, tipo: apisInputs.tipo.value, nac: apisInputs.nac.value, nacn: apisInputs.nacn.value },
    emergencia: { nombre: apisInputs.emgNombre.value, tel: apisInputs.emgTel.value },
    seat,
    fecha: new Date().toISOString()
  };
  localStorage.setItem("checkin", JSON.stringify(checkin));
}
