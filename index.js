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
  res.say('Available');
  res.shouldEndSession(false);
});

exports.handler = function(event, context) {
  console.log('Request: ' + event.request);

  if (event.request.intent && event.request.intent.slots) {
    console.log('Slots: ' + event.request.intent.slots);
  }

  app.lambda()(event, context);
};
