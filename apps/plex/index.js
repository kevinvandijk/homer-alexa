var alexa = require('alexa-app');
var Promise = require('bluebird');
var fetch = require('node-fetch');
var dotenv = require('dotenv');

fetch.Promise = Promise;

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
  var params = {
    name: req.slot('NAME')
  };

  fetch(apiUrl('start'), {
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: JSON.stringify(params)
  }).then(function(response) {
    return response.json();
  }).then(function(response) {
    res.say('Playing');
    res.send();
  }).catch(function(error) {
    res.say('Something went wrong');
    res.send();
  });

  return false;
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
