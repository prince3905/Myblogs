const bcrypt = require('bcryptjs');
const AdminUser = require('../../modules/users/admin-user.model');
const env = require('../../config/env');

async function seedAdmin() {
  const existing = await AdminUser.findOne({ email: env.adminEmail.toLowerCase() });
  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  return AdminUser.create({
    name: 'Admin',
    email: env.adminEmail.toLowerCase(),
    passwordHash
  });
}

module.exports = seedAdmin;
