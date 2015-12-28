var alexa = require('alexa-app');
var dotenv = require('dotenv');
var request = require('request-promise');

dotenv.load();

function apiUrl(path) {
  return process.env.HOMER_ADDRESS + '/api/plex/' + path;
};

var app = new alexa.app('homer-plex');

app.pre = function(req, res, type) {
  if (process.env.ALEXA_APP_ID) {
    if (req.sessionDetails.application.applicationId !== 'amzn1.echo-sdk-ams.app.' + process.env.ALEXA_APP_ID) {
      res.send();
    }
  }
};

app.launch(function(req, res) {
  res.say('awesome it works' + process.env.HOMER_ADDRESS);
  res.shouldEndSession(false);
});

app.intent('startShowOrMovie', {
  slots: {
    'NAME': 'LITERAL'
  },
  utterances: [
    'start {homeland|NAME}',
    'start playing {homeland|NAME}',
    'play {homeland|NAME}'
  ]
}, function(req, res) {
  var name = req.slot('NAME');
  var params = {
    name: name
  };

  var options = {
    method: 'POST',
    uri: apiUrl('start'),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: params,
    json: true
  };

  request(options).then(function(response) {
    res.send();
  }).catch(function(response) {
    var error = response.error;
    if (error.errorType === 'no-media-found') {
      res.say('I\'m sorry but I couldn\'t find ' + name + ' between your movies or tv shows');
    }
    console.log('error', response.error);
    res.send();
  });

  return false;
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
