const UserModel = require('../models/userModel');

async function ensureAuthenticated(req, res, next) {
  try {
    if (!req.session.userId) return res.redirect('/?error=Debes+iniciar+sesion');

    const user = await UserModel.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.redirect('/?error=Sesion+no+valida');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('ensureAuthenticated:', err);
    res.status(500).send('Error interno');
  }
}

function ensureRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = { ensureAuthenticated, ensureRole };