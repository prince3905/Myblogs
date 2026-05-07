const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../users/admin-user.model');
const env = require('../../config/env');

function signToken(user) {
  return jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: '7d' });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await AdminUser.findOne({ email: `${email || ''}`.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const matches = await bcrypt.compare(`${password || ''}`, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { login, me };
