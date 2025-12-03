const { College } = require('../models');

async function getAllColleges(req, res, next) {
    try {
        const colleges = await College.findAll({
            attributes: ['id', 'name', 'collegeCode', 'address'],
            order: [['name', 'ASC']]
        });
        return res.json({ success: true, data: colleges });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllColleges };
