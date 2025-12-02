// Modelo de usuarios con roles basicos y permisos por seccion.
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: true },
    edit: { type: Boolean, default: false }
  },
  { _id: false }
);

const buildDefaultPermissions = () => ({
  dashboard: { view: true, edit: false },
  import: { view: false, edit: false },
  products: { view: false, edit: false },
  trazabilidad: { view: false, edit: false }
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'cliente'], default: 'cliente' },
    permissions: {
      dashboard: { type: permissionSchema, default: () => ({ view: true, edit: false }) },
      import: { type: permissionSchema, default: () => ({ view: false, edit: false }) },
      products: { type: permissionSchema, default: () => ({ view: false, edit: false }) },
      trazabilidad: { type: permissionSchema, default: () => ({ view: false, edit: false }) }
    },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PERMISSION_SECTIONS = ['dashboard', 'import', 'products', 'trazabilidad'];
export const defaultPermissions = buildDefaultPermissions;

export default mongoose.models.User || mongoose.model('User', userSchema);
