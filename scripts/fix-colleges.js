const mysql = require('mysql2/promise');
const config = require('../src/config/config');

async function fixDatabase() {
    const connection = await mysql.createConnection({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        database: config.db.database
    });

    try {
        console.log('🔧 Starting database migration...\n');

        // Step 1: Check for duplicate college names
        const [duplicates] = await connection.query(`
      SELECT name, COUNT(*) as count 
      FROM colleges 
      GROUP BY name 
      HAVING count > 1
    `);

        if (duplicates.length > 0) {
            console.log('⚠️  Found duplicate college names:');
            duplicates.forEach(dup => {
                console.log(`   - "${dup.name}" appears ${dup.count} times`);
            });
            console.log('\nRemoving duplicates, keeping the first occurrence...\n');

            for (const dup of duplicates) {
                // Get all IDs for this name
                const [colleges] = await connection.query(
                    'SELECT id FROM colleges WHERE name = ? ORDER BY id',
                    [dup.name]
                );

                // Delete all except the first one
                for (let i = 1; i < colleges.length; i++) {
                    await connection.query('DELETE FROM colleges WHERE id = ?', [colleges[i].id]);
                    console.log(`   ✓ Removed duplicate "${dup.name}" (ID: ${colleges[i].id})`);
                }
            }
            console.log('');
        }

        // Step 2: Add column if it doesn't exist
        try {
            await connection.query(`ALTER TABLE colleges ADD COLUMN collegeCode VARCHAR(255) NULL`);
            console.log('✓ Added collegeCode column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ collegeCode column already exists');
            } else {
                throw err;
            }
        }

        // Step 3: Get existing colleges
        const [colleges] = await connection.query('SELECT id, name, collegeCode FROM colleges ORDER BY id');
        console.log(`\nFound ${colleges.length} colleges to update:`);

        // Step 4: Update colleges with codes
        for (let i = 0; i < colleges.length; i++) {
            const college = colleges[i];
            if (!college.collegeCode) {
                const code = `COL${String(i + 1).padStart(3, '0')}`;
                await connection.query(
                    'UPDATE colleges SET collegeCode = ? WHERE id = ?',
                    [code, college.id]
                );
                console.log(`  ✓ ${college.name} → ${code}`);
            } else {
                console.log(`  ✓ ${college.name} → ${college.collegeCode} (already set)`);
            }
        }

        // Step 5: Make column NOT NULL
        try {
            await connection.query(`ALTER TABLE colleges MODIFY COLUMN collegeCode VARCHAR(255) NOT NULL`);
            console.log('\n✓ Made collegeCode NOT NULL');
        } catch (err) {
            console.log('\n✓ collegeCode already NOT NULL');
        }

        // Step 6: Add unique constraint on collegeCode
        try {
            await connection.query(`ALTER TABLE colleges ADD CONSTRAINT colleges_collegeCode_unique UNIQUE (collegeCode)`);
            console.log('✓ Added unique constraint on collegeCode');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('✓ Unique constraint on collegeCode already exists');
            } else {
                throw err;
            }
        }

        // Step 7: Add unique constraint on name
        try {
            await connection.query(`ALTER TABLE colleges ADD CONSTRAINT colleges_name_unique UNIQUE (name)`);
            console.log('✓ Added unique constraint on name');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('✓ Unique constraint on name already exists');
            } else {
                throw err;
            }
        }

        console.log('\n✅ Database migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Restart the backend server');
        console.log('   2. Test TPO registration');
        console.log('   3. Test student registration\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Code:', err.code);
        if (err.sql) console.error('SQL:', err.sql);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

fixDatabase();
