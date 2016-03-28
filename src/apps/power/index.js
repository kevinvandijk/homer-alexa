var alexa = require('alexa-app');
var channelName = 'power';
var app = new alexa.app(channelName);

app.pre = function(req, res, type) {
  if (process.env.ALEXA_APP_ID) {
    if (req.sessionDetails.application.applicationId !== 'amzn1.echo-sdk-ams.app.' + process.env.ALEXA_APP_ID) {
      res.send();
    }
  }
};

var fs = require('fs');
var path = require('path');
var intents = JSON.parse(fs.readFileSync(path.join(__dirname, 'intents.json')));
var homerApi = require('./helpers').api;

function createIntent(name, cb) {
  app.intent(name, intents[name], cb);
};

function togglePower(device, action) {
  var params = {
    device: device
  };

  return homerApi.put(channelName, action, params);
}

createIntent('PowerDeviceOn', function(req, res) {
  togglePower(req.slot('DEVICE'), 'on').then(function(response) {
    res.say('Ok');
  }).catch(function(err) {
    res.say('Error');
    console.log('error', err);
  }).then(function() {
    res.send();
  });

  return false;
});

createIntent('PowerDeviceOff', function(req, res) {
  togglePower(req.slot('DEVICE'), 'off').then(function(response) {
    res.say('Ok');
  }).catch(function(err) {
    res.say('Error');
    console.log('error', err);
  }).then(function() {
    res.send();
  });

  return false;
});


// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
