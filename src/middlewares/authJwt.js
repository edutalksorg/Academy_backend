const { verify } = require('../utils/jwt');
const { User } = require('../models');

async function authJwt(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = verify(token);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account not active' });
    req.user = { id: user.id, role: user.role, collegeId: user.collegeId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized', errors: err.message });
  }
}

module.exports = authJwt;
