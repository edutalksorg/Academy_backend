const { sequelize, Test } = require('./src/models');

async function debug() {
    try {
        sequelize.options.logging = false;
        await sequelize.authenticate();
        console.log('DB Connected');

        const test = await Test.findOne({
            order: [['createdAt', 'DESC']],
            include: ['instructor']
        });
        console.log('--- LAST TEST ---');
        if (test) {
            console.log(`ID: ${test.id}`);
            console.log(`Title: ${test.title}`);
            console.log(`InstructorID: ${test.instructorId}`);
            console.log(`InstructorName: ${test.instructor?.name}`);
            console.log(`Status: ${test.status}`);
            console.log(`CreatedAt: ${test.createdAt}`);
        } else {
            console.log('No tests found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

debug();
