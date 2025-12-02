const Joi = require('joi');
const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { sign } = require('../utils/jwt');
const config = require('../config/config');

const registerSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required(), role: Joi.string().valid('student', 'instructor', 'tpo').required(), collegeId: Joi.number().optional() });

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });

    const { name, email, password, role, collegeId } = value;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const status = role === 'student' ? 'active' : 'pending';

    const user = await User.create({ name, email, passwordHash, role, status, collegeId: collegeId || null });

    return res.status(201).json({ success: true, message: 'Registered', data: { id: user.id, status: user.status } });
  } catch (err) {
    next(err);
  }
}

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });

    const { email, password } = value;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account not active' });

    const token = sign({ id: user.id, role: user.role });
    return res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
