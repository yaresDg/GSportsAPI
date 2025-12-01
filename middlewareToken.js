import jwt from 'jsonwebtoken';
import config from './config.js';

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Acceso no autorizado. No se proporcionó un token.' });
  try {
    const decoded = jwt.verify(token, config.tokenSecret);
    req.user = decoded;  // Agregar los datos decodificados al objeto de solicitud
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token no válido o expirado.' });
  }
};

export { verifyToken };