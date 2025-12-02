// Controlador de autenticacion: registro, login y perfil JWT.
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'secretdev';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;
const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'erick.a.colvincordova@gmail.com').toLowerCase();

export async function register(req, res) {
  try {
    // Verificar conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB no está conectado. Estado:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Base de datos no disponible. Por favor intenta más tarde.' });
    }

    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase?.();
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Formato de email inválido' });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const exist = await User.findOne({ email: normalizedEmail });
    if (exist) {
      return res.status(409).json({ message: 'Este email ya está registrado' });
    }

    // Crear hash de contraseña
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Crear usuario
    const newUser = { email: normalizedEmail, hash, role: 'cliente' };
    if (normalizedEmail === ROOT_ADMIN_EMAIL) {
      newUser.role = 'admin';
    }
    const user = await User.create(newUser);
    
    return res.status(201).json({ 
      id: user._id, 
      email: user.email, 
      role: user.role,
      permissions: user.permissions,
      message: 'Usuario creado exitosamente'
    });
  } catch (err) {
    console.error('register error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // Manejar errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `Datos de entrada inválidos: ${messages}` });
    }
    
    // Manejar errores de duplicados
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Este email ya está registrado' });
    }

    // Error de conexión a MongoDB
    if (err.name === 'MongooseError' || err.message?.includes('connection')) {
      return res.status(503).json({ message: 'Error de conexión a la base de datos. Intenta nuevamente.' });
    }
    
    // Retornar mensaje de error más específico
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Garantiza que el usuario maestro mantenga privilegios admin aunque se altere el rol.
    if (user.email === ROOT_ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    // Verificar contraseña
    const ok = await bcrypt.compare(password, user.hash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    
    return res.json({ 
      token, 
      user: { id: user._id, email: user.email, role: user.role, permissions: user.permissions },
      message: 'Login exitoso'
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function profile(req, res) {
  try {
    const user = await User.findById(req.user.id, '_id email role permissions');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });
  } catch (err) {
    console.error('profile error', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
