const Hemera = require('nats-hemera');
const HemeraJoi = require('hemera-joi');
const db = require('./db');

const nats = require('nats').connect({
  url: process.env.NATS_URL,
  user: process.env.NATS_USER,
  pass: process.env.NATS_PW,
});

const hemera = new Hemera(nats, {
  logLevel: process.env.HEMERA_LOG_LEVEL,
});

const sync = () => {
  db.sequelize.sync()
  .then(() => { console.log('db synced'); })
  .catch(console.error);
};

hemera.use(HemeraJoi);

hemera.ready(() => {
  const Joi = hemera.exposition['hemera-joi'].joi;

  // wait 3 seconds to connect to db
  setTimeout(sync, 3000);

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
      console.log('email: ', email);
      console.log('password: ', password);

      return cb(null, { success: true, result: user.get({ plain: true }) });
    })
    .catch((err) => {
      console.log('in da error')
      return cb(null, { success: false, message: 'Error' })
    })
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
      console.log('in da error')
      return cb(null, { success: false, message: 'Error' })
    })
  });
});
