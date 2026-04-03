import pool from './db/connection';

async function resetDatabase() {
  try {
    console.log('Clearing seed data...');

    const tables = [
      'subject_reservations',
      'grades',
      'subject_prerequisites',
      'students',
      'subjects',
      'courses',
      'users'
    ];

    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`✓ Cleared ${table}`);
    }

    console.log('\n✅ Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();