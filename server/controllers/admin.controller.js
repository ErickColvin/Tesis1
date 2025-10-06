import User from '../models/user.model.js';

export async function listUsers(req, res) {
  try {
    const users = await User.find({}, '_id email role createdAt').sort({ createdAt: -1 }).lean();
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
    if (!['user','admin'].includes(role)) return res.status(400).json({ message: 'invalid_role' });
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, fields: '_id email role' });
    if (!user) return res.status(404).json({ message: 'not_found' });
    return res.json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error('updateRole', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}
