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
  logging: false
}); 
 
module.exports = sequelize;