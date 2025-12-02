const { sequelize } = require('../models');

// TPO: college report
async function collegeReport(req, res, next) {
  try {
    const collegeId = parseInt(req.query.collegeId || req.user.collegeId, 10);
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

    // basic aggregates using raw queries for simplicity
    const replacements = { collegeId };
    let where = 'WHERE u.collegeId = :collegeId';
    if (dateFrom) { where += ' AND a.createdAt >= :dateFrom'; replacements.dateFrom = dateFrom; }
    if (dateTo) { where += ' AND a.createdAt <= :dateTo'; replacements.dateTo = dateTo; }

    const sql = `
      SELECT
        COUNT(DISTINCT u.id) as studentCount,
        COUNT(a.id) as attemptsCount,
        AVG(a.totalScore) as avgScore,
        SUM(CASE WHEN a.totalScore >= 0 THEN 1 ELSE 0 END) as scoredCount
      FROM users u
      LEFT JOIN attempts a ON a.userId = u.id
      ${where};
    `;

    const [results] = await sequelize.query(sql, { replacements });
    res.json({ success: true, data: results[0] || {} });
  } catch (err) { next(err); }
}

// SuperAdmin: global report
async function globalReport(req, res, next) {
  try {
    const sql = `
      SELECT c.id, c.name,
        COUNT(DISTINCT u.id) as studentCount,
        AVG(a.totalScore) as avgScore,
        COUNT(at.id) as attempts
      FROM colleges c
      LEFT JOIN users u ON u.collegeId = c.id AND u.role = 'student'
      LEFT JOIN attempts at ON at.userId = u.id
      LEFT JOIN attempts a ON a.id = at.id
      GROUP BY c.id, c.name
      ORDER BY c.name;
    `;
    const [rows] = await sequelize.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

module.exports = { collegeReport, globalReport };
