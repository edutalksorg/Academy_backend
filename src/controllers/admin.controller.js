const userService = require('../services/user.service');

async function getPendingUsers(req, res, next) {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const data = await userService.getPendingUsers({ q, limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function approveUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await userService.approveUser(id);
    res.json({ success: true, message: 'User approved' });
  } catch (err) { next(err); }
}

module.exports = { getPendingUsers, approveUser };
