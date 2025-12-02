// Controlador de administracion: gestiona usuarios, roles y permisos granulares.
import User, { PERMISSION_SECTIONS } from '../models/user.model.js';

export async function listUsers(req, res) {
  try {
    const users = await User.find({}, '_id email role permissions createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json(users);
  } catch (err) {
    console.error('listUsers', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}

export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin','user','cliente'].includes(role)) return res.status(400).json({ message: 'invalid_role' });
    if (role !== 'admin') {
      const target = await User.findById(id, 'role');
      if (!target) return res.status(404).json({ message: 'not_found' });
      if (target.role === 'admin') {
        // Evita dejar el sistema sin al menos un admin activo.
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'must_have_one_admin' });
        }
      }
    }
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, fields: '_id email role permissions' }
    );
    if (!user) return res.status(404).json({ message: 'not_found' });
    return res.json({ id: user._id, email: user.email, role: user.role, permissions: user.permissions });
  } catch (err) {
    console.error('updateRole', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}

export async function updatePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'invalid_permissions' });
    }

    const updates = {};
    PERMISSION_SECTIONS.forEach((section) => {
      if (permissions[section]) {
        updates[`permissions.${section}.view`] = Boolean(permissions[section].view);
        updates[`permissions.${section}.edit`] = Boolean(permissions[section].edit);
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'invalid_permissions' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, fields: '_id email role permissions' }
    );

    if (!user) return res.status(404).json({ message: 'not_found' });

    return res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });
  } catch (err) {
    console.error('updatePermissions', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}
