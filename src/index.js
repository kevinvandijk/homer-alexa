var alexa = require('alexa-app');

var app = new alexa.app('homer');

app.pre = function(req, res, type) {
  if (process.env.ALEXA_APP_ID) {
    if (req.sessionDetails.application.applicationId !== 'amzn1.echo-sdk-ams.app.' + process.env.ALEXA_APP_ID) {
      res.send();
    }
  }
};

require('./channels/plex')(app);

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
