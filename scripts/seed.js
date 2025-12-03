const { sequelize, User, College, Test, Question, Option, Attempt, AttemptAnswer } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Ensure tables exist
    await sequelize.sync();
    console.log('✓ Database tables synced');

    // Create colleges
    const [greenfield] = await College.findOrCreate({
      where: { name: 'Greenfield Institute' },
      defaults: { name: 'Greenfield Institute', collegeCode: 'GFI001', address: '123 Green Street, Boston, MA' }
    });
    const [riverview] = await College.findOrCreate({
      where: { name: 'Riverview College' },
      defaults: { name: 'Riverview College', collegeCode: 'RVC002', address: '456 River Road, Cambridge, MA' }
    });
    const [techValley] = await College.findOrCreate({
      where: { name: 'Tech Valley University' },
      defaults: { name: 'Tech Valley University', collegeCode: 'TVU003', address: '789 Tech Avenue, San Francisco, CA' }
    });
    console.log('✓ Created 3 colleges');

    // Create SuperAdmin
    const superEmail = 'admin@system.com';
    const [superAdmin] = await User.findOrCreate({
      where: { email: superEmail },
      defaults: {
        name: 'System Administrator',
        email: superEmail,
        passwordHash: await hashPassword('Admin@123'),
        role: 'superadmin',
        status: 'active'
      }
    });
    console.log(`✓ SuperAdmin: ${superEmail} / Admin@123`);

    // Create TPOs
    const [tpo1] = await User.findOrCreate({
      where: { email: 'tpo@greenfield.edu' },
      defaults: {
        name: 'John TPO',
        email: 'tpo@greenfield.edu',
        passwordHash: await hashPassword('Tpo@123'),
        role: 'tpo',
        status: 'active',
        collegeId: greenfield.id
      }
    });

    const [tpo2] = await User.findOrCreate({
      where: { email: 'tpo@riverview.edu' },
      defaults: {
        name: 'Sarah TPO',
        email: 'tpo@riverview.edu',
        passwordHash: await hashPassword('Tpo@123'),
        role: 'tpo',
        status: 'pending', // Pending approval
        collegeId: riverview.id
      }
    });
    console.log('✓ Created 2 TPOs (1 active, 1 pending)');

    // Create Instructors
    const [instructor1] = await User.findOrCreate({
      where: { email: 'instructor@greenfield.edu' },
      defaults: {
        name: 'Dr. Robert Smith',
        email: 'instructor@greenfield.edu',
        passwordHash: await hashPassword('Instructor@123'),
        role: 'instructor',
        status: 'active',
        collegeId: greenfield.id
      }
    });

    const [instructor2] = await User.findOrCreate({
      where: { email: 'instructor@riverview.edu' },
      defaults: {
        name: 'Prof. Emily Johnson',
        email: 'instructor@riverview.edu',
        passwordHash: await hashPassword('Instructor@123'),
        role: 'instructor',
        status: 'pending', // Pending approval
        collegeId: riverview.id
      }
    });

    const [instructor3] = await User.findOrCreate({
      where: { email: 'instructor@techvalley.edu' },
      defaults: {
        name: 'Dr. Michael Chen',
        email: 'instructor@techvalley.edu',
        passwordHash: await hashPassword('Instructor@123'),
        role: 'instructor',
        status: 'active',
        collegeId: techValley.id
      }
    });
    console.log('✓ Created 3 Instructors (2 active, 1 pending)');

    // Create Students
    const students = [
      { name: 'Alice Johnson', email: 'student@college.edu', college: greenfield },
      { name: 'Bob Williams', email: 'bob@greenfield.edu', college: greenfield },
      { name: 'Charlie Brown', email: 'charlie@greenfield.edu', college: greenfield },
      { name: 'Diana Prince', email: 'diana@riverview.edu', college: riverview },
      { name: 'Eve Martinez', email: 'eve@riverview.edu', college: riverview },
      { name: 'Frank Castle', email: 'frank@techvalley.edu', college: techValley },
      { name: 'Grace Hopper', email: 'grace@techvalley.edu', college: techValley },
      { name: 'Henry Ford', email: 'henry@greenfield.edu', college: greenfield },
    ];

    for (const s of students) {
      await User.findOrCreate({
        where: { email: s.email },
        defaults: {
          name: s.name,
          email: s.email,
          passwordHash: await hashPassword('Student@123'),
          role: 'student',
          status: 'active',
          collegeId: s.college.id
        }
      });
    }
    console.log('✓ Created 8 Students');

    // Create Tests with Questions
    const [test1] = await Test.findOrCreate({
      where: { title: 'JavaScript Fundamentals' },
      defaults: {
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of basic JavaScript concepts',
        instructorId: instructor1.id,
        collegeId: greenfield.id,
        timeLimit: 30,
        totalMarks: 10,
        status: 'published'
      }
    });

    // Add questions to test1
    if (test1.dataValues.createdAt === test1.dataValues.updatedAt) {
      const q1 = await Question.create({ testId: test1.id, text: 'What is the correct syntax for referring to an external script called "app.js"?', marks: 2 });
      await Option.bulkCreate([
        { questionId: q1.id, text: '<script href="app.js">', isCorrect: false },
        { questionId: q1.id, text: '<script name="app.js">', isCorrect: false },
        { questionId: q1.id, text: '<script src="app.js">', isCorrect: true },
        { questionId: q1.id, text: '<script file="app.js">', isCorrect: false }
      ]);

      const q2 = await Question.create({ testId: test1.id, text: 'How do you create a function in JavaScript?', marks: 2 });
      await Option.bulkCreate([
        { questionId: q2.id, text: 'function myFunction()', isCorrect: true },
        { questionId: q2.id, text: 'function:myFunction()', isCorrect: false },
        { questionId: q2.id, text: 'function = myFunction()', isCorrect: false },
        { questionId: q2.id, text: 'create myFunction()', isCorrect: false }
      ]);

      const q3 = await Question.create({ testId: test1.id, text: 'How do you call a function named "myFunction"?', marks: 2 });
      await Option.bulkCreate([
        { questionId: q3.id, text: 'call myFunction()', isCorrect: false },
        { questionId: q3.id, text: 'myFunction()', isCorrect: true },
        { questionId: q3.id, text: 'call function myFunction()', isCorrect: false },
        { questionId: q3.id, text: 'execute myFunction()', isCorrect: false }
      ]);

      const q4 = await Question.create({ testId: test1.id, text: 'How to write an IF statement in JavaScript?', marks: 2 });
      await Option.bulkCreate([
        { questionId: q4.id, text: 'if i = 5 then', isCorrect: false },
        { questionId: q4.id, text: 'if (i == 5)', isCorrect: true },
        { questionId: q4.id, text: 'if i == 5 then', isCorrect: false },
        { questionId: q4.id, text: 'if i = 5', isCorrect: false }
      ]);

      const q5 = await Question.create({ testId: test1.id, text: 'How does a FOR loop start?', marks: 2 });
      await Option.bulkCreate([
        { questionId: q5.id, text: 'for (i = 0; i <= 5)', isCorrect: false },
        { questionId: q5.id, text: 'for (i = 0; i <= 5; i++)', isCorrect: true },
        { questionId: q5.id, text: 'for i = 1 to 5', isCorrect: false },
        { questionId: q5.id, text: 'for (i <= 5; i++)', isCorrect: false }
      ]);
    }

    const [test2] = await Test.findOrCreate({
      where: { title: 'Data Structures & Algorithms' },
      defaults: {
        title: 'Data Structures & Algorithms',
        description: 'Test your understanding of common data structures and algorithms',
        instructorId: instructor3.id,
        collegeId: techValley.id,
        timeLimit: 45,
        totalMarks: 15,
        status: 'published'
      }
    });

    if (test2.dataValues.createdAt === test2.dataValues.updatedAt) {
      const q1 = await Question.create({ testId: test2.id, text: 'What is the time complexity of binary search?', marks: 3 });
      await Option.bulkCreate([
        { questionId: q1.id, text: 'O(n)', isCorrect: false },
        { questionId: q1.id, text: 'O(log n)', isCorrect: true },
        { questionId: q1.id, text: 'O(n^2)', isCorrect: false },
        { questionId: q1.id, text: 'O(1)', isCorrect: false }
      ]);

      const q2 = await Question.create({ testId: test2.id, text: 'Which data structure uses LIFO?', marks: 3 });
      await Option.bulkCreate([
        { questionId: q2.id, text: 'Queue', isCorrect: false },
        { questionId: q2.id, text: 'Stack', isCorrect: true },
        { questionId: q2.id, text: 'Array', isCorrect: false },
        { questionId: q2.id, text: 'Tree', isCorrect: false }
      ]);

      const q3 = await Question.create({ testId: test2.id, text: 'What is the worst-case time complexity of QuickSort?', marks: 3 });
      await Option.bulkCreate([
        { questionId: q3.id, text: 'O(n log n)', isCorrect: false },
        { questionId: q3.id, text: 'O(n^2)', isCorrect: true },
        { questionId: q3.id, text: 'O(n)', isCorrect: false },
        { questionId: q3.id, text: 'O(log n)', isCorrect: false }
      ]);

      const q4 = await Question.create({ testId: test2.id, text: 'Which traversal visits the root node first?', marks: 3 });
      await Option.bulkCreate([
        { questionId: q4.id, text: 'Inorder', isCorrect: false },
        { questionId: q4.id, text: 'Preorder', isCorrect: true },
        { questionId: q4.id, text: 'Postorder', isCorrect: false },
        { questionId: q4.id, text: 'Level order', isCorrect: false }
      ]);

      const q5 = await Question.create({ testId: test2.id, text: 'What is a hash collision?', marks: 3 });
      await Option.bulkCreate([
        { questionId: q5.id, text: 'When two keys hash to the same index', isCorrect: true },
        { questionId: q5.id, text: 'When hash function fails', isCorrect: false },
        { questionId: q5.id, text: 'When table is full', isCorrect: false },
        { questionId: q5.id, text: 'When key is null', isCorrect: false }
      ]);
    }

    const [test3] = await Test.findOrCreate({
      where: { title: 'Database Management Systems' },
      defaults: {
        title: 'Database Management Systems',
        description: 'Test covering SQL and database concepts',
        instructorId: instructor1.id,
        collegeId: greenfield.id,
        timeLimit: 40,
        totalMarks: 12,
        status: 'draft' // Draft test
      }
    });

    console.log('✓ Created 3 Tests (2 published, 1 draft) with questions');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━'.repeat(50));
    console.log('SuperAdmin: admin@system.com / Admin@123');
    console.log('TPO: tpo@greenfield.edu / Tpo@123');
    console.log('Instructor: instructor@greenfield.edu / Instructor@123');
    console.log('Student: student@college.edu / Student@123');
    console.log('━'.repeat(50));

  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n✓ Seed script completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n✗ Seed script failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
