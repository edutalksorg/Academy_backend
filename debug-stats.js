const fs = require('fs');
const { User, College, Test, Attempt } = require('./src/models');

async function checkStats() {
    try {
        const totalColleges = await College.count();
        const totalUsers = await User.count();
        const pendingApprovals = await User.count({ where: { status: 'pending' } });
        const activeTests = await Test.count({ where: { status: 'published' } });

        const totalStudents = await User.count({ where: { role: 'student' } });
        const totalInstructors = await User.count({ where: { role: 'instructor' } });
        const totalTPOs = await User.count({ where: { role: 'tpo' } });
        const totalAttempts = await Attempt.count();

        const output = `
--- DB STATS ---
Total Colleges: ${totalColleges}
Total Users: ${totalUsers}
Pending Approvals: ${pendingApprovals}
Active Tests: ${activeTests}
Total Students: ${totalStudents}
Total Instructors: ${totalInstructors}
Total TPOs: ${totalTPOs}
Total Attempts: ${totalAttempts}
----------------
    `;
        fs.writeFileSync('stats.txt', output);
        console.log('Stats written to stats.txt');
    } catch (err) {
        console.error('Error checking stats:', err);
        fs.writeFileSync('stats.txt', 'Error: ' + err.message);
    }
}

checkStats();
