// src/middleware/adminMiddleware.js
function ensureAdmin(req, res, next) {
  // req.user debe existir porque antes pasas por ensureAuthenticated
  const role = req.user?.role;

  if (role === "admin") return next();

  // Puedes devolver HTML o JSON según ruta
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(403).json({ error: "Solo admin" });
  }

  return res.status(403).send("Acceso denegado (solo admin)");
}

module.exports = { ensureAdmin };