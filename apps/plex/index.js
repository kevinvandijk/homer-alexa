var alexa = require('alexa-app');
var app = new alexa.app('homer-plex');

app.pre = function(req, res, type) {
  if (process.env.ALEXA_APP_ID) {
    if (req.sessionDetails.application.applicationId !== 'amzn1.echo-sdk-ams.app.' + process.env.ALEXA_APP_ID) {
      res.send();
    }
  }
};

app.launch(function(req, res) {
  res.say('Available And stuff');
  res.shouldEndSession(false);
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
