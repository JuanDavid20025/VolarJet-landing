// Helpers
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const form = $('#formRegistro');
const pwd = $('#password');
const confirmPwd = $('#confirm');
const pwdBadge = $('#pwdBadge');

// Mostrar/ocultar contraseñas
$$('.eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.innerHTML = `<i class="fa-regular fa-${input.type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
  });
});

// Validaciones básicas
const rules = {
  nombres: v => v.trim().length > 1 || 'Ingresa tus nombres.',
  apellidos: v => v.trim().length > 1 || 'Ingresa tus apellidos.',
  tipoDoc: v => v !== '' || 'Selecciona el tipo de documento.',
  numDoc: v => /^\d{6,12}$/.test(v) || 'Debe tener 6 a 12 dígitos.',
  telefono: v => /^\d{7,12}$/.test(v.replace(/\s/g,'')) || 'Ingresa un teléfono válido.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo no válido.',
  password: v => passwordStrength(v).score >= 2 || 'La contraseña es muy débil.',
  confirm: v => v === pwd.value || 'Las contraseñas no coinciden.',
  pais: v => v !== '' || 'Selecciona tu país.',
  nacimiento: v => !!v || 'Selecciona tu fecha de nacimiento.',
  rol: v => v !== '' || 'Selecciona un rol.',
  acepto: v => v === true || 'Debes aceptar los términos.'
};

// Fuerza de contraseña
function passwordStrength(v){
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[a-z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++; // opcional
  return { score, value: v };
}

function updateBadge(){
  const s = passwordStrength(pwd.value).score;
  pwdBadge.className = 'badge';
  if (s <= 2){ // muy débil / débil
    pwdBadge.textContent = s <= 1 ? 'Muy débil' : 'Débil';
  }else if (s === 3){
    pwdBadge.textContent = 'Aceptable';
    pwdBadge.classList.add('badge--warn');
  }else if (s === 4){
    pwdBadge.textContent = 'Fuerte';
    pwdBadge.classList.add('badge--ok');
  }else{
    pwdBadge.textContent = 'Excelente';
    pwdBadge.classList.add('badge--good');
  }
}
pwd.addEventListener('input', updateBadge);
updateBadge();

// Mostrar errores por campo
function setError(input, msg){
  const field = input.closest('.field') || input.closest('.terms');
  const small = field.querySelector('.error') || field.querySelector('[data-for="acepto"].error');
  if (small){ small.textContent = typeof msg === 'string' ? msg : ''; }
  if (typeof msg === 'string') {
    input.setAttribute('aria-invalid','true');
    input.classList.add('is-error');
  } else {
    input.removeAttribute('aria-invalid');
    input.classList.remove('is-error');
  }
}

// Validación on blur
$$('input, select').forEach(el=>{
  el.addEventListener('blur', () => validateField(el));
});

function validateField(el){
  const name = el.id;
  const value = el.type === 'checkbox' ? el.checked : el.value;
  if (rules[name]){
    const ok = rules[name](value);
    setError(el, ok === true ? null : ok);
    return ok === true;
  }
  return true;
}

// Submit
form.addEventListener('submit', (e)=>{
  e.preventDefault();

  let allOk = true;
  $$('input, select').forEach(el=>{
    if (!validateField(el)) allOk = false;
  });

  // términos (checkbox independiente)
  const acepto = $('#acepto');
  const aceptoOk = rules.acepto(acepto.checked);
  setError(acepto, aceptoOk === true ? null : aceptoOk);
  if (!aceptoOk) allOk = false;

  if (!allOk) return;

  // Simulación de envío (aquí integrarías tu backend o Firebase)
  const payload = Object.fromEntries(new FormData(form).entries());
  console.log('Registro enviado:', payload);

  alert('✅ Cuenta creada correctamente.\nRevisa la consola para ver el payload.');
  form.reset();
  updateBadge();
});

// Botón limpiar
$('#btnLimpiar').addEventListener('click', ()=>{
  $$('small.error').forEach(s=> s.textContent = '');
  updateBadge();
});
