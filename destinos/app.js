/* ===== VolarJet – Destinos ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const COP = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);

const DATA = [
  { code:"CTG", nombre:"Cartagena",   region:"Caribe",   tags:["Playa","Cultura"],    desde:149900, popular:98,  promo:true,  nuevo:false },
  { code:"ADZ", nombre:"San Andrés",  region:"Caribe",   tags:["Playa","Naturaleza"], desde:189900, popular:92,  promo:false, nuevo:true  },
  { code:"SMR", nombre:"Santa Marta", region:"Caribe",   tags:["Playa","Naturaleza"], desde:159900, popular:88,  promo:true,  nuevo:false },
  { code:"MDE", nombre:"Medellín",    region:"Andina",   tags:["Ciudad","Cultura"],   desde:119900, popular:97,  promo:false, nuevo:false },
  { code:"BOG", nombre:"Bogotá",      region:"Andina",   tags:["Ciudad","Cultura"],   desde:119900, popular:95,  promo:false, nuevo:false },
  { code:"CLO", nombre:"Cali",        region:"Pacífico", tags:["Ciudad","Cultura"],   desde:129900, popular:84,  promo:false, nuevo:false },
  { code:"BAQ", nombre:"Barranquilla",region:"Caribe",   tags:["Ciudad","Cultura"],   desde:139900, popular:80,  promo:false, nuevo:false },
  { code:"PEI", nombre:"Pereira",     region:"Andina",   tags:["Naturaleza","Ciudad"],desde:129900, popular:76,  promo:false, nuevo:false },
  { code:"BGA", nombre:"Bucaramanga", region:"Andina",   tags:["Naturaleza","Ciudad"],desde:129900, popular:73,  promo:false, nuevo:false },
  { code:"PSO", nombre:"Pasto",       region:"Andina",   tags:["Cultura","Naturaleza"],desde:139900, popular:70, promo:false, nuevo:false },
  { code:"MTR", nombre:"Montería",    region:"Caribe",   tags:["Naturaleza"],         desde:139900, popular:66,  promo:false, nuevo:false },
  { code:"CUC", nombre:"Cúcuta",      region:"Andina",   tags:["Ciudad"],             desde:139900, popular:65,  promo:false, nuevo:false },
];

let state = {
  q: "", region: "", tags: new Set(), precioMax: 400000,
  orden: "popular", soloFav: false, favs: new Set(loadFavs())
};

const grid = $("#grid");
const empty = $("#empty");
const resumen = $("#resumen");

/* ==== Init ==== */
(function init(){
  // Eventos filtros
  $("#q").addEventListener("input", e => { state.q = (e.target.value||"").trim().toLowerCase(); render(); });
  $("#region").addEventListener("change", e => { state.region = e.target.value; render(); });
  $("#orden").addEventListener("change", e => { state.orden = e.target.value; render(); });

  $("#precio").addEventListener("input", e => {
    state.precioMax = Number(e.target.value);
    $("#precio-val").textContent = COP(state.precioMax);
    render();
  });

  $("#chips").addEventListener("click", (e)=>{
    const b = e.target.closest(".chip"); if(!b) return;
    const tag = b.dataset.tag;
    if(state.tags.has(tag)) state.tags.delete(tag); else state.tags.add(tag);
    b.classList.toggle("active");
    render();
  });

  $("#solo-fav").addEventListener("change", e => { state.soloFav = e.target.checked; render(); });
  $("#limpiar").addEventListener("click", resetFilters);
  $("#quitar-filtros").addEventListener("click", resetFilters);

  render();
})();

function resetFilters(){
  state = { q:"", region:"", tags:new Set(), precioMax:400000, orden:"popular", soloFav:false, favs:state.favs };
  $("#q").value = ""; $("#region").value = ""; $("#orden").value = "popular";
  $("#precio").value = 400000; $("#precio-val").textContent = COP(400000);
  $$("#chips .chip").forEach(c=>c.classList.remove("active"));
  $("#solo-fav").checked = false;
  render();
}

/* ==== Render ==== */
function render(){
  const list = DATA.filter(filtros).sort(sorter(state.orden));
  grid.innerHTML = "";
  if(list.length===0){
    empty.classList.remove("hidden");
  }else{
    empty.classList.add("hidden");
    list.forEach(d => grid.appendChild(card(d)));
  }
  resumen.textContent = `${list.length} destino${list.length!==1?"s":""} — filtros: `
    + `${state.region||"todas las regiones"}, `
    + `${state.tags.size? [...state.tags].join(", ") : "todas las categorías"}, `
    + `hasta ${COP(state.precioMax)}${state.soloFav?" — solo favoritos":""}`;
}

function filtros(d){
  if(state.soloFav && !state.favs.has(d.code)) return false;
  if(state.region && d.region !== state.region) return false;
  if(state.tags.size && ![...state.tags].every(t => d.tags.includes(t))) return false;
  if(d.desde > state.precioMax) return false;
  if(state.q){
    const hay = (d.nombre+" "+d.code).toLowerCase().includes(state.q);
    if(!hay) return false;
  }
  return true;
}

function sorter(mode){
  if(mode==="precioAsc")  return (a,b)=>a.desde-b.desde;
  if(mode==="precioDesc") return (a,b)=>b.desde-a.desde;
  if(mode==="nuevo")      return (a,b)=>Number(b.nuevo)-Number(a.nuevo) || b.popular-a.popular;
  return (a,b)=>b.popular-a.popular; // popular
}

/* ==== Card ==== */
function card(d){
  const el = document.createElement("article");
  el.className = "card dest";
  el.innerHTML = `
    <div class="cover">
      <img src="${imgPath(d.code)}" alt="${d.nombre}" onerror="this.style.display='none'; this.parentElement.querySelector('.fallback').style.display='grid';" />
      <div class="fallback" style="display:none">${d.code}</div>
      <div class="badges">
        <span class="badge">${d.region}</span>
        ${d.promo?'<span class="badge promo">Promo</span>':''}
        ${d.nuevo?'<span class="badge">Nuevo</span>':''}
      </div>
      <button class="fav ${state.favs.has(d.code)?'active':''}" title="Favorito" data-code="${d.code}">${state.favs.has(d.code)?'⭐':'☆'}</button>
    </div>
    <div class="body">
      <div class="title">
        <div class="name">${d.nombre}</div>
        <div class="iata">${d.code}</div>
      </div>
      <div class="tags">${d.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div class="bottom">
        <div class="price">Desde <span>${COP(d.desde)}</span></div>
        <div class="actions">
          <button class="btn ghost" data-det="${d.code}">Detalles</button>
          <button class="btn primary" data-go="${d.code}">Ver vuelos</button>
        </div>
      </div>
    </div>
  `;

  // Favorito
  el.querySelector(".fav").addEventListener("click", (e)=>{
    const code = e.currentTarget.dataset.code;
    if(state.favs.has(code)){ state.favs.delete(code); } else { state.favs.add(code); }
    saveFavs([...state.favs]);
    render();
  });

  // Detalles (demo)
  el.querySelector('[data-det]').addEventListener("click", ()=>{
    alert(`${d.nombre} (${d.code})\n\nCategorías: ${d.tags.join(", ")}\nRegión: ${d.region}\nTarifa desde: ${COP(d.desde)}\n\n(En producción: abrir página de destino con guía y tips)`);
  });

  // Ver vuelos: pasa preferencia y abre el buscador
  el.querySelector('[data-go]').addEventListener("click", ()=>{
    // Guardamos preferencia de destino para que el buscador pueda leerla
    localStorage.setItem("buscar_pref", JSON.stringify({ dest: d.code }));
    location.href = "../buscar_reserva/index.html";
  });

  return el;
}

function imgPath(code){
  // Busca imagen en ../img/destinos/<code>.jpg (puedes usar .png si prefieres)
  return `../img/destinos/${code.toLowerCase()}.jpg`;
}

/* ==== Favoritos en storage ==== */
function loadFavs(){
  try{ return JSON.parse(localStorage.getItem("favoritos_destinos")||"[]"); }catch{ return []; }
}
function saveFavs(arr){
  localStorage.setItem("favoritos_destinos", JSON.stringify(arr));
}

/* ==== Extras: si el buscador quiere leer la preferencia ====
   En tu página buscar_reserva/index.html puedes prellenar así:
   const pref = JSON.parse(localStorage.getItem("buscar_pref") || "null");
   if(pref?.dest){ document.querySelector('#destino').value = pref.dest; }
   // (y luego localStorage.removeItem('buscar_pref') si quieres limpiar)
*/
