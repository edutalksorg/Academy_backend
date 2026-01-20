require('dotenv').config();
const { getCollegeReport, getPendingUsers } = require('./src/services/user.service');
const { College, User } = require('./src/models');

async function testReport() {
    try {
        // 1. Find a college
        const college = await College.findOne();
        if (!college) {
            console.log('No college found.');
            return;
        }
        console.log('Testing for College:', college.name, 'ID:', college.id);

        // 2. Get Report
        const report = await getCollegeReport(college.id, {
            dateFrom: '2025-01-01', // Adjust dates as needed
            dateTo: '2025-12-31'
        });

        console.log('Report Result:', JSON.stringify(report, null, 2));

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testReport();
