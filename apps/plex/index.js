var alexa = require('alexa-app');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
var intents = JSON.parse(fs.readFileSync(path.join(__dirname, 'intents.json')));

var app = new alexa.app('homer-plex');
app.dictionary = JSON.parse(fs.readFileSync(path.join(__dirname, 'dictionary.json')));

app.pre = function(req, res, type) {
  if (process.env.ALEXA_APP_ID) {
    if (req.sessionDetails.application.applicationId !== 'amzn1.echo-sdk-ams.app.' + process.env.ALEXA_APP_ID) {
      res.send();
    }
  }
};

createIntent('StartShowOrMovie', function(req, res) {
  var name = req.slot('NAME');
  var params = {
    name: name
  };

  helpers.apiRequest('GET', 'find', params).then(function(response) {
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

function createIntent(name, cb) {
  app.intent(name, intents[name], cb);
}

function playRequest(res, item, options) {
  options = options || {};
  var params = { id: item.id };
  if (options.restart) params.restart = true;
  // var something = reply.bind(null, res);

  return helpers.apiRequest('GET', 'play', params).then(function(response) {
    return reply(res, 'start-playing', response.data);
  }).catch(function(err) {
    return reply(res, 'general-error');
  });
}

var actions = {
  play: function(res, item, options) {
    var playItem = item;

    if (item.type === 'show') {
      var currentEpisode = item.meta.currentEpisode;
      if (!currentEpisode) return reply(res, 'can-not-restart-show-yet');

      playItem = item.meta.currentEpisode;
    }

    if (playItem.attributes.viewOffset) {
      return (playItem.type === 'episode'
        ? reply(res, 'ask-for-episode-resume', item)
        : reply(res, 'ask-for-movie-resume', item)
      );
    }

    playRequest(res, playItem);
  },

  resumeCurrentEpisode: function(res, data) {
    playRequest(res, data.currentEpisode);
  },

  nextEpisode: function(res, data) {
    if (!data.nextEpisode) return reply(res, 'can-not-restart-show-yet');
    playRequest(res, data.nextEpisode);
  },

  restartEpisode: function(res, data) {
    playRequest(res, data.currentEpisode, { restart: true });
  },

  resumeMovie: function(res, data) {
    playRequest(res, data);
  },

  restartMovie: function(res, data) {
    playRequest(res, data, { restart: true });
  }
};

function reply(res, type, data) {
  switch (type) {
    case 'can-not-restart-show-yet':
      res.say('Sorry, I am too dumb to restart a show for now.');
      break;

    case 'start-playing':
      res.say('Enjoy ' + data.attributes.title + '!');
      break;

    case 'ask-for-episode-resume':
      res.say('You didn\'t finish watching last time. Do you want to continue, restart, or play the next episode?');
      res.session('actions', {
        Resume: 'resumeCurrentEpisode',
        Next: 'nextEpisode',
        Restart: 'restartEpisode'
      });
      res.session('meta', data.meta);
      res.shouldEndSession(false);
      break;

    case 'ask-for-movie-resume':
      res.say('You didn\'t finish watching last time. Do you want to continue or restart?');
      res.session('actions', {
        Resume: 'resumeMovie',
        Restart: 'restartMovie'
      });
      res.session('meta', data);
      res.shouldEndSession(false);
      break;

    case 'session-required':
      res.say('Sorry, I don\'t remember what happened. Please start over.');
      break;

    case 'not-certain':
      var suggestion = (data.type === 'movie'
        ? ''
        : 'an episode of '
      ) + data.attributes.title;

      res.say('I\'m not sure what you mean. Do you want to watch ' + suggestion + '?');
      res.session('actions', {
        Yes: 'play'
      });
      res.session('meta', {
        id: data.id
      });
      res.shouldEndSession(false);
      break;

    default:
      res.say('Sorry, something went wrong. Please try again later.');
      break;
  }

  res.send();
}

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
