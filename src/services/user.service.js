const { User } = require('../models');

const { Op } = require('sequelize');

async function getPendingUsers({ q, limit = 50, offset = 0 } = {}) {
  const where = { status: 'pending' };
  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ];
  }
  return User.findAndCountAll({ where, attributes: ['id', 'name', 'email', 'role', 'collegeId', 'createdAt'], limit, offset });
}

async function approveUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
  user.status = 'active';
  await user.save();
  return user;
}

async function findById(id) {
  return User.findByPk(id);
}

async function findStudentsByCollege(collegeId, { limit = 20, offset = 0 } = {}) {
  // optional: support q search
  const where = { collegeId, role: 'student' };
  if (arguments[1] && arguments[1].q) {
    const q = arguments[1].q;
    where[Op.or] = [ { name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } } ];
  }
  return User.findAndCountAll({ where, limit, offset, attributes: ['id', 'name', 'email', 'createdAt'] });
}

module.exports = { getPendingUsers, approveUser, findById, findStudentsByCollege };
