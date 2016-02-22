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
      actions.play(res, media[0]).then(function(reply) {
        console.log('result');
      });
    }
  }).catch(function(err) {
    console.log('error', err);
  });

  return false;
});

createIntent(['Yes', 'Resume'], function(req, res) {
  var action = req.session('actions') && req.session('actions').Yes;
  if (!action) reply(res, 'session-required');
  var meta = req.session('meta');

  actions[action].apply(actions, [res, meta]);
  return false;
});

function createIntent(nameOrNames, cb) {
  if (Array.isArray(nameOrNames)) {
    nameOrNames.map(function(name) {
      app.intent(name, intents[name], cb);
    });
  } else {
    app.intent(nameOrNames, intents[nameOrNames], cb);
  }
}

var actions = {
  play: function(res, data) {
    var params = { id: data.id };
    if (data.resume) params.resume = true;

    return helpers.apiRequest('GET', 'play', params).then(function(response) {
      reply(res, 'start-playing', response.data.attributes);
    }).catch(function(err) {
      var body = err.error.errors[0];

      if (err.statusCode === 412 && body.title === 'partially-watched') {
        reply(res, 'ask-for-resume', data);
      } else {
        reply(res, 'general-error', data);
      }
    });
  },

  resume: function(res, data) {
    data.resume = true;
    return this.play(res, data);
  }
};

function reply(res, type, data) {
  switch (type) {
    case 'general-error':
      res.say('Sorry, something went wrong. Please try again later.');
      break;

    case 'start-playing':
      res.say('Enjoy ' + data.title + '!');
      break;

    case 'ask-for-resume':
      res.say('You didn\'t finish watching last time. Do you want to resume it, or start the next episode?');
      res.session('actions', {
        Yes: 'resume',
        Resume: 'resume',
        Next: 'next',
      });
      res.session('meta', {
        id: data.id
      });
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
  }

  res.send();
}

// Export both as lambda handler and as alexa-app for alexa-app-server debugging
exports.handler = app.lambda();
module.exports = app;
