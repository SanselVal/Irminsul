// Base de datos inicial de usuarios
function inicializarUsuarios() {
  if (!localStorage.getItem('irminsul_usuarios')) {
    const usuariosIniciales = [
      { usuario: 'admin', pass: '123', rol: 'admin' },
      { usuario: 'viajero', pass: '123', rol: 'user' }
    ];
    localStorage.setItem('irminsul_usuarios', JSON.stringify(usuariosIniciales));
  }
}

// Control de vistas pestaña Login / Registro
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

// Iniciar Sesión
function iniciarSesion(event) {
  event.preventDefault();
  const user = document.getElementById('login-usuario').value.trim();
  const pass = document.getElementById('login-password').value.trim();
  const msgError = document.getElementById('mensaje-login-error');

  const usuarios = JSON.parse(localStorage.getItem('irminsul_usuarios')) || [];
  const coincidencia = usuarios.find(u => u.usuario.toLowerCase() === user.toLowerCase() && u.pass === pass);

  if (coincidencia) {
    sessionStorage.setItem('irminsul_sesion', JSON.stringify(coincidencia));
    verificarEstadoSesion();
  } else {
    msgError.innerText = 'Credenciales no válidas o usuario no registrado.';
  }
}

// Verificar si el usuario ya inició sesión
function verificarEstadoSesion() {
  const sesionActiva = JSON.parse(sessionStorage.getItem('irminsul_sesion'));
  const pantallaLogin = document.getElementById('pantalla-login');
  const contenidoPrivado = document.getElementById('contenido-privado');

  if (sesionActiva) {
    pantallaLogin.classList.add('hidden');
    contenidoPrivado.classList.remove('hidden');

    document.getElementById('badge-usuario').innerText = `Usuario: ${sesionActiva.usuario} (${sesionActiva.rol})`;

    if (sesionActiva.rol === 'admin') {
      document.getElementById('btn-admin-panel').classList.remove('hidden');
    } else {
      document.getElementById('btn-admin-panel').classList.add('hidden');
    }

    cargarPersonajes();
  } else {
    pantallaLogin.classList.remove('hidden');
    contenidoPrivado.classList.add('hidden');
  }
}

// Cerrar Sesión
function cerrarSesion() {
  sessionStorage.removeItem('irminsul_sesion');
  verificarEstadoSesion();
}

// Abrir y Cerrar Modal de Admin
function abrirModalAdmin() {
  document.getElementById('modal-admin').classList.remove('hidden');
  renderizarListaUsuarios();
}

function cerrarModalAdmin() {
  document.getElementById('modal-admin').classList.add('hidden');
}

// Crear nuevos usuarios desde el Admin
function crearNuevoUsuario(event) {
  event.preventDefault();
  const nuevoUser = document.getElementById('nuevo-user').value.trim();
  const nuevoPass = document.getElementById('nuevo-pass').value.trim();
  const nuevoRol = document.getElementById('nuevo-rol').value;

  let usuarios = JSON.parse(localStorage.getItem('irminsul_usuarios')) || [];

  if (usuarios.some(u => u.usuario.toLowerCase() === nuevoUser.toLowerCase())) {
    alert('Ese nombre de usuario ya existe.');
    return;
  }

  usuarios.push({ usuario: nuevoUser, pass: nuevoPass, rol: nuevoRol });
  localStorage.setItem('irminsul_usuarios', JSON.stringify(usuarios));

  alert(`Usuario ${nuevoUser} creado exitosamente.`);
  document.getElementById('form-crear-usuario').reset();
  renderizarListaUsuarios();
}

// Purgar y crear un Admin Maestro
function establecerAdminMaestro(event) {
  event.preventDefault();
  const masterUser = document.getElementById('master-user').value.trim();
  const masterPass = document.getElementById('master-pass').value.trim();

  const nuevosUsuarios = [
    { usuario: masterUser, pass: masterPass, rol: 'admin' }
  ];

  localStorage.setItem('irminsul_usuarios', JSON.stringify(nuevosUsuarios));
  sessionStorage.setItem('irminsul_sesion', JSON.stringify(nuevosUsuarios[0]));

  alert('¡Se purgaron los usuarios de prueba! Ahora solo tu cuenta maestra tiene acceso.');
  document.getElementById('form-master-admin').reset();
  cerrarModalAdmin();
  verificarEstadoSesion();
}

// Renderizar lista de usuarios en el modal
function renderizarListaUsuarios() {
  const lista = document.getElementById('lista-usuarios-admin');
  const usuarios = JSON.parse(localStorage.getItem('irminsul_usuarios')) || [];
  lista.innerHTML = '';

  usuarios.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${u.usuario}</strong> (${u.rol})</span> <span>Clave: ${u.pass}</span>`;
    lista.appendChild(li);
  });
}

// Cargar y Renderizar tarjetas de personajes detalladas
function cargarPersonajes() {
  fetch('personajes.json')
    .then(response => response.json())
    .then(personajes => {
      const contenedor = document.getElementById('contenedor-personajes');
      contenedor.innerHTML = ''; // Limpiar contenedor
      
      personajes.forEach(personaje => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');
        
        // Manejo de la 'ñ' o posibles nombres de propiedad de cumpleaños
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
    })
    .catch(error => console.error('Error al cargar la base de datos:', error));
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  inicializarUsuarios();
  verificarEstadoSesion();
});