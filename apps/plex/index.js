var alexa = require('alexa-app');
var dotenv = require('dotenv');
var request = require('request-promise');
var Promise = require('bluebird');

dotenv.load();

function apiUrl(path) {
  return process.env.HOMER_ADDRESS + '/api/plex/' + path;
};

function startShowOrMovie(params) {
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
      var say = 'I\'m sorry but something went wrong.';
      var data;
      var shouldEndSession = true;
      var error = body.error;
      switch (error.type) {
        case 'no-name-or-key-specified':
          say = 'I\'m sorry but I didn\'t catch that.';
          break;
        case 'not-certain':
          var suggestion = error.suggestion;
          data = {
            onYes: 'startByKey',
            onNo: '',
            media: suggestion
          };
          shouldEndSession = false;
          var typeText = '' + (suggestion.type === 'movie' ? '' : 'an episode of ') + suggestion.title;
          say = 'I\'m not sure what you meant. Did you want to watch ' + typeText + '?';
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

app.intent('Yes', {
  utterances: [
    '{yes|yeah|okay|yes please|indeed|I did}'
  ]
}, function(req, res) {
  var data = req.session('data');

  if (!data) {
    res.say('Sorry, I don\'t remember what we were talking about, please start over');
    return res.send();
  }

  if (data.onYes === 'startByKey') {
    var params = {
      key: data.key
    };

    startShowOrMovie(params).then(function() {
      res.say('Enjoy watching ' + data.title + '!');
    }).catch(function(reply) {
      res.say(reply.say);
      res.shouldEndSession(reply.shouldEndSession);
      if (reply.data) res.session('data', reply.data);
      res.send();
    });
  } else {
    res.say('Sorry, I don\'t know what to do right now, please start over');
    res.send();
  }

  return false;
});

app.intent('No', {
  utterances: [
    'no|nope'
  ]
}, function(req, res) {

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

  startShowOrMovie(params, res).then(function(reply) {
    res.say(reply.say);
    res.send();
  }).catch(function(reply) {
    res.say(reply.say);
    res.shouldEndSession(reply.shouldEndSession);
    if (reply.data) res.session('data', reply.data);
    res.send();
  });

  return false;
});

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
