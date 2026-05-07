const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AdminUser = require('../../modules/users/admin-user.model');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await AdminUser.findById(payload.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
