const Hapi = require('hapi');
const Hemera = require('nats-hemera');
const Boom = require('boom');

// connect to nats & create Hemera wrapper around core NATS driver
const nats = require('nats').connect({
  url: process.env.NATS_URL,
  user: process.env.NATS_USER,
  pass: process.env.NATS_PW,
});

const hemera = new Hemera(nats, {
  logLevel: process.env.HEMERA_LOG_LEVEL,
});

// create and configure new server
const server = new Hapi.Server();
server.connection({
  port: process.env.API_PORT,
  host: process.env.API_HOST,
});

/* ----- Hapi API Handlers ------
*  Use the nats server to get data from microservices, then reply with result
*/

const signuphandler = function (request, reply) {
  hemera.act({
    topic: 'auth',
    cmd: 'signup',
    email: request.payload.email,
    password: request.payload.password,
  },
  (err, result) => {
    if (err) return reply(Boom.wrap(err.cause, 400));
    return reply(result);
  });
};

const getusershandler = function (request, reply) {
  hemera.act({
    topic: 'users',
    cmd: 'get',
  },
  (err, result) => {
    if (err) return reply(Boom.wrap(err.cause, 400));
    return reply(result);
  });
};

/* When hemera is ready and connected to nats, start the hapi server */
hemera.ready(() => {
  // handlers connect external requests to internal data
  server.route({
    method: 'POST',
    path: '/api/signup',
    handler: signuphandler,
  });

  server.route({
    method: 'GET',
    path: '/api/users',
    handler: getusershandler,
  });

  server.start((err) => {
    if (err) throw err;
    console.log(`Server running at: ${server.info.uri}`);
  });
});
