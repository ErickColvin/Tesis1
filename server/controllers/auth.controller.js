import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secretdev';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;

export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const exist = await User.findOne({ email });
    if (exist) return res.status(409).json({ message: 'user_exists' });
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, hash });
    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.hash);
    if (!ok) return res.status(401).json({ message: 'invalid_credentials' });
    const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}
