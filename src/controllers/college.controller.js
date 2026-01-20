const { College } = require('../models');

async function getAllColleges(req, res, next) {
    try {
        const { User } = require('../models');
        const colleges = await College.findAll({
            attributes: ['id', 'name', 'collegeCode', 'address'],
            include: [{
                model: User,
                where: { role: 'tpo' },
                required: false, // Left join, show colleges even if no TPO
                attributes: ['id', 'name', 'email']
            }],
            order: [['name', 'ASC']]
        });
        return res.json({ success: true, data: colleges });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllColleges };
