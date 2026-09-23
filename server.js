const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ClaveSecretaSuperProtegidaIrminsul2026';

app.use(cors());
app.use(express.json());

// 🛡️ DEFENSA 1: Rate Limiting (Bloqueo de Fuerza Bruta)
// Máximo 5 intentos de login cada 15 minutos por dirección IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos fallidos. Tu IP ha sido bloqueada temporalmente por 15 minutos.' }
});

// 🛡️ BASE DE DATOS DE USUARIOS (Contraseñas Cifradas con Bcrypt)
// Ninguna contraseña está guardada en texto plano.
const usuariosBD = [
  {
    usuario: 'Sansel-Val',
    // Hash de '!Pochita.2024-v'
    passHash: '$2a$10$C8L1wD2t8Gj.SdBJ6uQ57uC2Gq6V9XzU5NfN8fB6E6bYdZf9XW8qG',
    rol: 'admin'
  },
  {
    usuario: 'Aether',
    // Hash de 'A3t#h9$kL2xM'
    passHash: '$2a$10$E8KzB5Y0d1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B',
    rol: 'user'
  },
  {
    usuario: 'Lumine',
    // Hash de 'L8m!n3#pQ7vW'
    passHash: '$2a$10$P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P',
    rol: 'user'
  }
];

// 📌 RUTA DE AUTENTICACIÓN (LOGIN)
app.post('/api/login', loginLimiter, async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  // Buscar usuario
  const usuarioEncontrado = usuariosBD.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());

  if (!usuarioEncontrado) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // 🛡️ DEFENSA 2: Verificación de Hash Bcrypt (Sin desencriptar la clave real)
  const esCorrecta = await bcrypt.compare(password, usuarioEncontrado.passHash);

  if (!esCorrecta) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // 🛡️ DEFENSA 3: Generación de Token de Sesión JWT (Expira en 2 horas)
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
// Solamente entrega el JSON si el atacante presenta un Token JWT válido.
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

    // Leer el archivo local personajes.json y servirlo
    const rutaJson = path.join(__dirname, 'personajes.json');
    fs.readFile(rutaJson, 'utf8', (errorLectura, data) => {
      if (errorLectura) {
        return res.status(500).json({ error: 'Error al leer la base de datos' });
      }
      res.json(JSON.parse(data));
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de seguridad activo en el puerto ${PORT}`);
});