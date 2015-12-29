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
    var alexaReply = 'I\'m sorry but something went wrong.';
    var error = response.error;
    switch (error.type) {
      case 'no-name-specified':
        alexaReply = 'I\'m sorry but I didn\'t catch that. Which movie or show did you want to watch?';
        break;
      case 'multiple-media-found':
        alexaReply = 'I\'m not sure what you meant. Did you want to watch the ' + error.suggestion.type + ': ' + error.suggestion.title + '?';
        break;
    }

    res.say(alexaReply);
    res.send();
  });

  return false;
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
