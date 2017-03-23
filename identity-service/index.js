const Hemera = require('nats-hemera');
const HemeraJoi = require('hemera-joi');
const { db, sync } = require('./db');

/* ----- Hemera and NATS configuration -----
* Connect to nats & create Hemera wrapper around core NATS driver
*/

const nats = require('nats').connect({
  url: process.env.NATS_URL,
  user: process.env.NATS_USER,
  pass: process.env.NATS_PW,
});

const hemera = new Hemera(nats, {
  logLevel: process.env.HEMERA_LOG_LEVEL,
});

hemera.use(HemeraJoi); // inject Joi so we can use it inside of Hemera actions

/* ----- Start Listening for Identity Actions -----
* Add listeners to handle any actions sent by the API Gateway
*/

hemera.ready(() => {
  const Joi = hemera.exposition['hemera-joi'].joi;

  setTimeout(sync, 3000); // wait 3 seconds to connect to db

  hemera.add({
    topic: 'auth',
    cmd: 'signup',
    email: Joi.required(),
    password: Joi.required(),
  }, function (req, cb) {
    const { email, password } = req;
    const User = db.sequelize.model('user');
    User.create({ email, password })
    .then((user) => {
      return cb(null, { success: true, result: user.get({ plain: true }) });
    })
    .catch((err) => {
      return cb(null, { success: false, message: 'Error' })
    });
  });

  hemera.add({
    topic: 'users',
    cmd: 'get',
  }, function (req, cb) {
    const User = db.sequelize.model('user');
    User.findAll({ raw: true })
    .then((usersArr) => {
      return cb(null, { success: true, result: usersArr });
    })
    .catch((err) => {
      return cb(null, { success: false, message: 'Error' })
    });
  });
});
