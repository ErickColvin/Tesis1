import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

const emailArg = process.argv[2];
const targetEmail = (emailArg || process.env.ROOT_ADMIN_EMAIL || '').toLowerCase();

if (!targetEmail) {
  console.error('Uso: node scripts/promote-admin.js correo@dominio.com');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracelink';

const logUri = MONGODB_URI.includes('@')
  ? MONGODB_URI.replace(/:[^:@]+@/, ':****@')
  : MONGODB_URI;

async function promote() {
  try {
    console.log(`Conectando a ${logUri} ...`);
    await mongoose.connect(MONGODB_URI);

    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`No se encontró un usuario con el correo ${targetEmail}`);
      process.exit(1);
    }

    console.log(`✅ ${user.email} ahora tiene rol ADMIN`);
    process.exit(0);
  } catch (err) {
    console.error('Error promoviendo usuario:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

promote();
