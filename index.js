// TODO: Find better thing than this module:

var AlexaAppServer = require('alexa-app-server');

var server = new AlexaAppServer({
  port: 3001,
  debug: true,
  server_root: __dirname,
  app_dir: './src/apps'
});

server.start();
