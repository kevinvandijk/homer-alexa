var alexa = require('alexa-app');
var dotenv = require('dotenv');
var request = require('request-promise');
var Promise = require('bluebird');

dotenv.load();

function apiUrl(path) {
  return process.env.HOMER_ADDRESS + '/api/plex/' + path;
};

var requestHelpers = {
  startShowOrMovie: function(params) {
    return new Promise(function(resolve, reject) {
      var requestOptions = {
        method: 'POST',
        uri: apiUrl('start'),
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: params,
        json: true
      };

      request(requestOptions).then(function(body) {
        resolve(body);
      }).catch(function(body) {
        var say = 'I\'m sorry, Homer did not respond.';
        var data;
        var shouldEndSession = true;
        var error = body.error;
        switch (error.type) {
          case 'no-name-or-key-specified':
            say = 'I\'m sorry, I didn\'t catch that.';
            break;

          case 'not-certain':
            var suggestion = error.suggestion;
            data = {
              onYes: 'startByKey',
              key: suggestion.key
            };
            shouldEndSession = false;
            var typeText = '' + (suggestion.type === 'movie' ? '' : 'an episode of ') + suggestion.title;
            say = 'I\'m not sure what you mean. Do you want to watch ' + typeText + '?';
            break;

          case 'partially-watched-episode':
            // TODO: Restart option for current episode
            var episode = error.media;
            say = 'You didn\'t finish episode ' + episode.episode + ' of season ' + episode.season + '. Do you want to resume it, or start the next episode?';
            data = {
              onResume: 'resumeByKey',
              onNext: 'startNext',
              key: episode.showKey
            };
            shouldEndSession = false;
            break;

          case 'no-unwatched-episode':
            var show = error.media;
            say = 'You have no unwatched ' + show.title + ' episodes left. Do you want to rewatch the show from the beginning?';
            data = {
              onRestart: 'restartByKey',
              key: show.showKey
            };
            shouldEndSession = false;
            break;

          case 'partially-watched-movie':
            var movie = error.media;
            say = 'You didn\'t finish ' + movie.title + '. Do you want to resume it, or restart it?';
            data = {
              onResume: 'resumeByKey',
              onRestart: 'restartByKey',
              key: movie.key
            };
            shouldEndSession = false;
            break;
        }

        var reply = {
          say: say,
          data: data,
          shouldEndSession: shouldEndSession
        };
        reject(reply);
      });
    });
  }
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

var intentHelpers = {
  getSessionData: function(req, res) {
    var data = req.session('data');

    if (!data) {
      res.say('Sorry, I don\'t remember what we were talking about, please start over.');
      return false;
    }

    return data;
  },

  startShowOrMovie: function(req, res, params) {
    requestHelpers.startShowOrMovie(params).then(function(reply) {
      var media = reply.media;
      var mediaTitle = (media.type === 'episode' ? media.show + ': ' + media.title : media.title);

      res.say('Enjoy ' + mediaTitle + '!');
      res.send();
    }).catch(function(reply) {
      res.say(reply.say);
      res.shouldEndSession(reply.shouldEndSession);
      if (reply.data) res.session('data', reply.data);
      res.send();
    });
  }
};

app.intent('Yes', {
  utterances: [
    'yes',
    'yeah',
    'okay',
    'ok',
    'yes please',
    'indeed',
    'I did'
  ]
}, function(req, res) {
  var data = intentHelpers.getSessionData(req, res);
  if (!data) return res.send();
  var params;

  if (data.onYes === 'startByKey') {
    params = {
        key: data.key
    };

    intentHelpers.startShowOrMovie(req, res, params);
  } else if (data.onYes === 'restartByKey') {
    params = {
      key: data.key,
      restart: true
    };

    intentHelpers.startShowOrMovie(req, res, params);
  } else {
    res.say('Sorry, I don\'t know what you mean');
    res.send();
  }

  return false;
});

// TODO: Expand so it can be directly used as an entry by saying:
// "Resume my last watched tv show / movie" or "Resume Movie name"
app.intent('Resume', {
  utterances: [
    'resume',
    'resume it',
    'continue',
    'continue it'
  ]
}, function(req, res) {
  var data = intentHelpers.getSessionData(req, res);
  if (!data) return res.send();

  if (data.onResume === 'resumeByKey') {
    var params = {
      key: data.key,
      resume: true
    };

    intentHelpers.startShowOrMovie(req, res, params);
  } else {
    res.say('Sorry, I don\'t know what you mean.');
    res.send();
  }

  return false;
});

app.intent('Next', {
  utterances: [
    'the next one',
    'the next',
    'next',
    'start the next one',
    'start a new one'
  ]
}, function(req, res) {
  var data = intentHelpers.getSessionData(req, res);
  if (!data) return res.send();

  if (data.onNext === 'startNext') {
    var params = {
      key: data.key,
      nextEpisode: true
    };

    intentHelpers.startShowOrMovie(req, res, params);
  } else {
    res.say('Sorry, I don\'t know what you mean.');
    res.send();
  }

  return false;
});

app.intent('Restart', {
  utterances: [
    'start over',
    'start again',
    'restart',
    'restart it',
    'rewatch',
    'rewatch it'
  ]
}, function(req, res) {
  var data = intentHelpers.getSessionData(req, res);
  if (!data) return res.send();

  if (data.onRestart === 'restartByKey') {
    var params = {
      key: data.key,
      restart: true
    };

    intentHelpers.startShowOrMovie(req, res, params);
  }

  return false;
});

app.intent('No', {
  utterances: [
    'no',
    'nope',
    'nah',
    'nevermind',
    'never mind'
  ]
}, function(req, res) {
  var data = intentHelpers.getSessionData(req, res);
  if (!data) return res.send();
  if (!data.onNo) return res.send();
});

app.intent('StartShowOrMovie', {
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

  intentHelpers.startShowOrMovie(req, res, params);

  return false;
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
