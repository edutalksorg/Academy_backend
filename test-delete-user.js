require('dotenv').config();
const { User, College } = require('./src/models');
const { deleteUser } = require('./src/services/user.service');

async function testDelete() {
    try {
        // 1. Create a dummy user
        const college = await College.findOne();
        if (!college) {
            console.log("No college found, cannot create user.");
            return;
        }

        const email = `deleteme_${Date.now()}@test.com`;
        const user = await User.create({
            name: 'Delete Me',
            email: email,
            password: 'password123',
            role: 'instructor',
            collegeId: college.id,
            status: 'active'
        });

        console.log(`Created user: ${user.id} - ${user.email}`);

        // 2. Delete the user
        console.log('Deleting user...');
        await deleteUser(user.id);

        // 3. Verify deletion
        const check = await User.findByPk(user.id);
        if (!check) {
            console.log('SUCCESS: User deleted properly.');
        } else {
            console.error('FAILURE: User still exists.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testDelete();
