module.exports = function reply(res, type, data) {
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
};
