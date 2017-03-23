const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const pg = require('pg');
delete pg.native;

const sequelize = new Sequelize(
  process.env.PG_DB_NAME || 'dev',
  process.env.PG_USER || '',
  process.env.PG_PASSWORD || '', {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || '5432',
    native: false,
    dialect: 'postgres',
  }
);

function setEmailAndPassword(user) {
  user.email = user.email.toLowerCase();

  return new Promise((resolve, reject) => {
    return bcrypt.hash(user.get('password'), 10,
    (err, hash) => {
      if (err) reject(err);
      user.set('password', hash);
      resolve(user);
    });
  });
}

function authenticate(plaintext) {
  return new Promise((resolve, reject) => {
    return bcrypt.compare(plaintext, this.password,
    (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

sequelize.define('user', {
  uid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'uid',
  },
  firstName: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'first_name',
  },
  lastName: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'last_name',
  },
  email: {
    type: Sequelize.TEXT,
    unique: true,
    allowNull: false,
    field: 'email',
  },
  password: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'password',
  },
}, {
  tableName: 'user',
  hooks: {
    beforeCreate: setEmailAndPassword,
    beforeUpdate: setEmailAndPassword,
  },
  instanceMethods: {
    authenticate,
  },
});

const db = {};

db.sequelize = sequelize;

// helper for syncing db
const sync = () => {
  db.sequelize.sync()
  .then(() => { console.log('db synced'); })
  .catch(console.error);
};

module.exports = {
  db,
  sync,
};
