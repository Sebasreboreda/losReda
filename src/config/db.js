const path = require('path');
const { Sequelize } = require('sequelize');

const isPkg = typeof process.pkg !== 'undefined';
const defaultDbPath = isPkg
  ? path.join(path.dirname(process.execPath), 'database.sqlite')
  : path.join(__dirname, '../../database.sqlite');

const storage = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDbPath;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
}); 
 
module.exports = sequelize;
