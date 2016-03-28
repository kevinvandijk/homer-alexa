var fs = require('fs');
var path = require('path');
var intents = JSON.parse(fs.readFileSync(path.join(__dirname, 'intents.json')));
var homerApi = require('../../helpers').api;

module.exports = function(app, channelName) {
  channelName = channelName || 'power';

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
}
