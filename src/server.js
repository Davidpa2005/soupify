const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

require('./config/db');

const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const playerRoutes = require('./routes/playerRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { ensureAuthenticated } = require('./middleware/authMiddleware');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data') }),
    secret: 'cambia-esta-clave-super-secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
  })
);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(adminRoutes);

app.use('/', authRoutes);
app.use('/', catalogRoutes);
app.use('/', playlistRoutes);
app.use('/', playerRoutes);
app.use('/', favoriteRoutes);
app.use('/', historyRoutes);
app.use('/', adminRoutes);

app.get('/favorites', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favorites.html'));
});

app.get('/history', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'history.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});