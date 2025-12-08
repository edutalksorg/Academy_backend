const Joi = require('joi');
const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { sign } = require('../utils/jwt');
const config = require('../config/config');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'instructor', 'tpo').required(),
  collegeId: Joi.number().optional(),
  collegeName: Joi.string().when('role', { is: 'tpo', then: Joi.required(), otherwise: Joi.forbidden() }),
  collegeCode: Joi.string().when('role', { is: 'tpo', then: Joi.required(), otherwise: Joi.forbidden() }),
  rollNumber: Joi.string().when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() })
});


async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });

    const { name, email, password, role, collegeId, collegeName, collegeCode, rollNumber } = value;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    let finalCollegeId = collegeId;

    // Student Registration Logic
    if (role === 'student') {
      if (!collegeId) return res.status(400).json({ success: false, message: 'College selection is required for students' });

      const { AllowedStudent } = require('../models');

      // Check whitelist
      const allowed = await AllowedStudent.findOne({
        where: {
          collegeId,
          email,
          rollNumber
        }
      });

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Registration not allowed. Your details (Email + Roll Number) do not match any pre-approved student record for this college.'
        });
      }

      if (allowed.isRegistered) {
        return res.status(409).json({ success: false, message: 'This student record has already been registered.' });
      }

      // Mark as registered later after successful user creation
    }

    // If TPO, create a new college
    if (role === 'tpo') {
      const { College } = require('../models');

      // Check if college name or code already exists
      const existingCollege = await College.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { name: collegeName },
            { collegeCode: collegeCode }
          ]
        }
      });

      if (existingCollege) {
        if (existingCollege.name === collegeName) {
          return res.status(409).json({ success: false, message: 'College name already exists' });
        }
        if (existingCollege.collegeCode === collegeCode) {
          return res.status(409).json({ success: false, message: 'College code already exists' });
        }
      }

      // Create new college
      const newCollege = await College.create({
        name: collegeName,
        collegeCode: collegeCode,
        address: null
      });

      finalCollegeId = newCollege.id;
    }

    const passwordHash = await hashPassword(password);
    const status = role === 'student' ? 'active' : 'pending';

    const user = await User.create({ name, email, passwordHash, role, status, collegeId: finalCollegeId || null, rollNumber: rollNumber || null });

    // If student, mark as registered
    if (role === 'student') {
      const { AllowedStudent } = require('../models');
      await AllowedStudent.update({ isRegistered: true }, {
        where: { collegeId: finalCollegeId, email, rollNumber }
      });
    }

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

    // Log activity (with deduplication to prevent double-logging from React StrictMode)
    const { ActivityLog } = require('../models');
    const { Op } = require('sequelize');
    const twoSecondsAgo = new Date(Date.now() - 2000);

    const recentLogin = await ActivityLog.findOne({
      where: {
        userId: user.id,
        action: 'LOGIN',
        createdAt: { [Op.gte]: twoSecondsAgo }
      }
    });

    if (!recentLogin) {
      await ActivityLog.create({ userId: user.id, action: 'LOGIN' });
    }

    return res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      const { ActivityLog } = require('../models');
      const { Op } = require('sequelize');
      const twoSecondsAgo = new Date(Date.now() - 2000);

      const recentLogout = await ActivityLog.findOne({
        where: {
          userId: req.user.id,
          action: 'LOGOUT',
          createdAt: { [Op.gte]: twoSecondsAgo }
        }
      });

      if (!recentLogout) {
        await ActivityLog.create({ userId: req.user.id, action: 'LOGOUT' });
      }
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout };
