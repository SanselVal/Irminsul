const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'ClaveSecretaSuperProtegidaIrminsul2026';

// Permite peticiones de cualquier origen (GitHub Pages)
app.use(cors({ origin: '*' }));
app.use(express.json());

// 🛡️ DEFENSA 1: Rate Limiting (Bloqueo de Fuerza Bruta)
// Máximo 10 intentos por cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos fallidos. Tu IP ha sido bloqueada temporalmente por 15 minutos.' }
});


const usuariosBD = [
  {
    usuario: 'Sansel-Val',
    passHash: '$2a$10$O0EAt.5o8o0v82Xq8oD4ze3U1w7KqL5fR4X6n.z/jO0M5Y4d1O6mS',
    rol: 'admin'
  },
  {
    usuario: 'Aether',
    passHash: '$2a$10$hK.S4r3yY8qW2E1rT0yU9u8i7o6p5a4s3d2f1g0h9j8k7l6z5x4c3',
    rol: 'user'
  },
  {
    usuario: 'Lumine',
    passHash: '$2a$10$bV9cX8zA7s6d5f4g3h2j1k0l9m8n7b6v5c4x3z2a1s0d9f8g7h6j5',
    rol: 'user'
  }
];

// 📌 RUTA DE AUTENTICACIÓN (LOGIN TRADICIONAL + COMPARACIÓN DIRECTA Y BCRYPT)
app.post('/api/login', loginLimiter, async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  // Buscar usuario (sin importar mayúsculas/minúsculas)
  const usuarioEncontrado = usuariosBD.find(
    u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
  );

  if (!usuarioEncontrado) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  // Comprobar contraseña para Sansel-Val de forma directa o por Bcrypt
  let esCorrecta = false;
  if (usuarioEncontrado.usuario === 'Sansel-Val' && password === '!Pochita.2024-v') {
    esCorrecta = true;
  } else if (usuarioEncontrado.usuario === 'Aether' && password === 'A3t#h9$kL2xM') {
    esCorrecta = true;
  } else if (usuarioEncontrado.usuario === 'Lumine' && password === 'L8m!n3#pQ7vW') {
    esCorrecta = true;
  } else {
    // Si la validación directa falla, prueba comparar Bcrypt
    try {
      esCorrecta = await bcrypt.compare(password, usuarioEncontrado.passHash);
    } catch (err) {
      esCorrecta = false;
    }
  }

  if (!esCorrecta) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // Generar Token JWT seguro
  const token = jwt.sign(
    { usuario: usuarioEncontrado.usuario, rol: usuarioEncontrado.rol },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  return res.json({
    mensaje: 'Acceso concedido',
    token,
    usuario: usuarioEncontrado.usuario,
    rol: usuarioEncontrado.rol
  });
});

// 📌 RUTA PROTEGIDA DE DATOS (`personajes.json`)
app.get('/api/personajes', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    const rutaJson = path.resolve(__dirname, 'personajes.json');

    if (!fs.existsSync(rutaJson)) {
      return res.status(500).json({ error: 'El archivo personajes.json no existe en el servidor' });
    }

    fs.readFile(rutaJson, 'utf8', (errorLectura, data) => {
      if (errorLectura) {
        return res.status(500).json({ error: 'Error al leer la base de datos' });
      }
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Formato de JSON inválido' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de seguridad activo en el puerto ${PORT}`);
});
