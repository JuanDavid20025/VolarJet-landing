// Utilidades
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const grid = $('#grid');
const searchInput = $('#q');
const chips = $('#chips');

// Filtrado por texto
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  filterCards({ text: q });
});

// Filtrado por chips
chips.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip').forEach(c => c.classList.remove('chip--active'));
  btn.classList.add('chip--active');
  filterCards({ tag: btn.dataset.filter });
});

// Lógica de filtrado
function filterCards({ text = '', tag = '' } = {}){
  $$('.card', grid).forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    const desc  = card.querySelector('p').textContent.toLowerCase();
    const tags  = (card.dataset.tags || '').toLowerCase();
    const byText = !text || title.includes(text) || desc.includes(text);
    const byTag  = !tag || tags.includes(tag);
    card.classList.toggle('hidden', !(byText && byTag));
  });
}

// Botones demo
grid.addEventListener('click', e => {
  const more = e.target.closest('[data-more]');
  const primary = e.target.closest('.btn.btn--primary');
  if (more){
    const title = e.target.closest('.card').querySelector('h3').textContent;
    alert(`ℹ️ Más información sobre: ${title}`);
  }
  if (primary){
    const title = e.target.closest('.card').querySelector('h3').textContent;
    console.log(`Acción: ${title}`);
  }
});

// Estado inicial
filterCards();
