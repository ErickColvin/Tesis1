// Middleware de autenticacion y control de rol admin.
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secretdev';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'unauthorized' });
    }
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.sub, '_id email role permissions');
    if (!user) {
      return res.status(401).json({ message: 'unauthorized' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };
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
