import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
const JWT_SECRET = process.env.JWT_SECRET || 'secretdev';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'unauthorized' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'forbidden' });
  return next();
}
