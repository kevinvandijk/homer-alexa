var fs = require('fs');
var path = require('path');
var helpers = require('../../helpers');
var actions = require('./actions');
var reply = require('./reply');
var intents = JSON.parse(fs.readFileSync(path.join(__dirname, 'intents.json')));
var channelName = 'plex';

module.exports = function(app) {
  function createIntent(name, cb) {
    app.intent(name, intents[name], cb);
  };

  createIntent('StartShowOrMovie', function(req, res) {
    var name = req.slot('NAME');
    var params = {
      name: name
    };

    helpers.apiRequest(channelName, 'GET', 'find', params).then(function(response) {
      var media = response.data;
      if (media.length > 1) {
        reply(res, 'not-certain', media[0]);
      } else {
        actions.play(res, media[0]);
      }
    }).catch(function(err) {
      console.log('error', err);
    });

    return false;
  });

  ['Yes', 'Resume', 'Next', 'Restart'].map(function(name) {
    createIntent(name, function(req, res) {
      var action = req.session('actions') && req.session('actions')[name];
      if (!action) return reply(res, 'session-required');
      var meta = req.session('meta');

      actions[action].apply(actions, [res, meta]);
      return false;
    });
  });
};
