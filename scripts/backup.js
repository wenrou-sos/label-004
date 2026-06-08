const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'chronic_followup',
};

try {
  console.log('Starting database backup...');
  const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > "${backupFile}"`;
  execSync(command);
  console.log(`Backup completed successfully: ${backupFile}`);
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length > 30) {
    files.slice(30).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`Deleted old backup: ${f}`);
    });
  }
} catch (error) {
  console.error('Backup failed:', error.message);
  process.exit(1);
}
