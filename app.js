// 🔗 REEMPLAZA ESTA URL CON LA QUE TE DÉ RENDER CUANDO SUBAS EL SERVIDOR
const BACKEND_URL = 'https://irminsul-sq8f.onrender.com';

function mostrarTab(tab) {
  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegistroBtn = document.getElementById('tab-registro-btn');
  const msgError = document.getElementById('mensaje-login-error');

  msgError.innerText = '';

  if (tab === 'login') {
    formLogin.classList.remove('hidden');
    formRegistro.classList.add('hidden');
    tabLoginBtn.classList.add('active');
    tabRegistroBtn.classList.remove('active');
  } else {
    formLogin.classList.add('hidden');
    formRegistro.classList.remove('hidden');
    tabLoginBtn.classList.remove('active');
    tabRegistroBtn.classList.add('active');
  }
}

// 🛡️ LOGIN CONECTADO AL BACKEND
async function iniciarSesion(event) {
  event.preventDefault();
  const usuario = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const msgError = document.getElementById('mensaje-login-error');

  msgError.innerText = 'Verificando con el servidor seguro...';

  try {
    const respuesta = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      msgError.innerText = data.error || 'Error de autenticación';
      return;
    }

    // Almacenar únicamente el Token Firmado (JWT), NO las claves
    sessionStorage.setItem('irminsul_jwt', data.token);
    sessionStorage.setItem('irminsul_user', JSON.stringify({ usuario: data.usuario, rol: data.rol }));

    verificarEstadoSesion();
  } catch (error) {
    msgError.innerText = 'Error al conectar con el servidor de seguridad.';
  }
}

function verificarEstadoSesion() {
  const token = sessionStorage.getItem('irminsul_jwt');
  const userData = JSON.parse(sessionStorage.getItem('irminsul_user'));
  const pantallaLogin = document.getElementById('pantalla-login');
  const contenidoPrivado = document.getElementById('contenido-privado');

  if (token && userData) {
    pantallaLogin.classList.add('hidden');
    contenidoPrivado.classList.remove('hidden');

    document.getElementById('badge-usuario').innerText = `Usuario: ${userData.usuario} (${userData.rol})`;

    if (userData.rol === 'admin') {
      document.getElementById('btn-admin-panel').classList.remove('hidden');
    } else {
      document.getElementById('btn-admin-panel').classList.add('hidden');
    }

    cargarPersonajesSeguros();
  } else {
    pantallaLogin.classList.remove('hidden');
    contenidoPrivado.classList.add('hidden');
  }
}

function cerrarSesion() {
  sessionStorage.removeItem('irminsul_jwt');
  sessionStorage.removeItem('irminsul_user');
  verificarEstadoSesion();
}

function abrirModalAdmin() {
  document.getElementById('modal-admin').classList.remove('hidden');
}

function cerrarModalAdmin() {
  document.getElementById('modal-admin').classList.add('hidden');
}

// 🛡️ SOLICITUD AUTENTICADA DE PERSONAJES
async function cargarPersonajesSeguros() {
  const token = sessionStorage.getItem('irminsul_jwt');

  try {
    const respuesta = await fetch(`${BACKEND_URL}/api/personajes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!respuesta.ok) {
      alert('Sesión inválida o expirada.');
      cerrarSesion();
      return;
    }

    const personajes = await respuesta.json();
    const contenedor = document.getElementById('contenedor-personajes');
    contenedor.innerHTML = '';

    personajes.forEach(personaje => {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('tarjeta');
      
      const cumpleaños = personaje.cumpleaños || personaje['cumplea os'] || personaje.cumpleanios || 'Desconocido';
      const constelacion = personaje.constelacion || 'Desconocida';
      
      tarjeta.innerHTML = `
        <div class="tarjeta-header">
          <h2>${personaje.nombre}</h2>
          <span class="rareza">${'★'.repeat(personaje.rareza)}</span>
        </div>
        
        <div class="tarjeta-body">
          <p><strong>Rol:</strong> ${personaje.rol}</p>
          <p><strong>Sexo:</strong> ${personaje.sexo}</p>
          <p><strong>Nación:</strong> ${personaje.nacion}</p>
          <p><strong>Arma:</strong> ${personaje.arma}</p>
          <p><strong>Cumpleaños:</strong> ${cumpleaños}</p>
          <p><strong>Constelación:</strong> ${constelacion}</p>
        </div>

        <div class="badge-container">
          <span class="badge">${personaje.elemento}</span>
          <span class="badge">${personaje.tipo_poder}</span>
        </div>
      `;
      
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  verificarEstadoSesion();
});
