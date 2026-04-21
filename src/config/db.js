const path = require('path');
const { Sequelize } = require('sequelize');

function resolveSqliteStorage() {
  const runningAsPkg = Boolean(process.pkg);
  const execDir = path.dirname(process.execPath || process.cwd());
  const envValue = process.env.DATABASE_PATH;

  if (envValue && String(envValue).trim()) {
    if (runningAsPkg && !path.isAbsolute(envValue)) {
      return path.join(execDir, envValue);
    }
    const resolved = path.resolve(envValue);
    if (runningAsPkg && /[\\/](snapshot)[\\/]/i.test(resolved)) {
      return path.join(execDir, 'database.sqlite');
    }
    return resolved;
  }

  if (runningAsPkg) {
    return path.join(execDir, 'database.sqlite');
  }

  return path.join(__dirname, '../../database.sqlite');
}

const storage = resolveSqliteStorage();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
  retry: {
    match: [/SQLITE_BUSY/i],
    max: 10
  },
  dialectOptions: {
    busyTimeout: 10000
  }
}); 
 
sequelize.addHook('afterConnect', async (connection) => {
  if (!connection || typeof connection.run !== 'function') return;
  await new Promise((resolve) => connection.run('PRAGMA journal_mode = WAL;', resolve));
  await new Promise((resolve) => connection.run('PRAGMA busy_timeout = 10000;', resolve));
});

module.exports = sequelize;