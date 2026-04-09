const path = require('path');
const { Sequelize } = require('sequelize');

const runningAsPkg = Boolean(process.pkg);
const defaultStorage = runningAsPkg
  ? path.join(path.dirname(process.execPath), 'database.sqlite')
  : path.join(__dirname, '../../database.sqlite');

const storage = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultStorage;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
  retry: {
    match: [/SQLITE_BUSY/i],
    max: 10
  },
  dialectOptions: {
    // Wait before failing when the SQLite file is temporarily locked.
    busyTimeout: 10000
  }
}); 
 
sequelize.addHook('afterConnect', async (connection) => {
  if (!connection || typeof connection.run !== 'function') return;
  await new Promise((resolve) => connection.run('PRAGMA journal_mode = WAL;', resolve));
  await new Promise((resolve) => connection.run('PRAGMA busy_timeout = 10000;', resolve));
});

module.exports = sequelize;