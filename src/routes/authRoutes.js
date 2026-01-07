const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// GET / -> index.html (login)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// GET /register -> register.html
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'register.html'));
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.redirect('/register?error=Rellena+todos+los+campos');
    }

    if (password.length < 8) {
      return res.redirect('/register?error=La+contraseña+debe+tener+al+menos+8+caracteres');
    }

    // ¿existe ya?
    const existing = await UserModel.findByEmailOrUsername(email);
    if (existing) {
      return res.redirect('/register?error=Usuario+o+email+ya+existen');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser(username, email, hash, 'User');

    // logueamos directamente tras registro
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.redirect('/home');
  } catch (err) {
    console.error('Error en /register:', err);
    res.redirect('/register?error=Error+interno');
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.redirect('/?error=Rellena+todos+los+campos');
    }

    const user = await UserModel.findByEmailOrUsername(identifier);
    if (!user) {
      return res.redirect('/?error=Credenciales+incorrectas');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.redirect('/?error=Credenciales+incorrectas');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.redirect('/home');
  } catch (err) {
    console.error('Error en /login:', err);
    res.redirect('/?error=Error+interno');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/?mensaje=Sesion+cerrada');
  });
});

// GET /home (protegida)
router.get('/home', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'home.html'));
});

module.exports = router;