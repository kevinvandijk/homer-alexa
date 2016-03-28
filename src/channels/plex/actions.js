var helpers = require('../../helpers');
var reply = require('./reply');
var channelName = 'plex';

function playRequest(res, item, options) {
  options = options || {};
  var params = { id: item.id };
  if (options.restart) params.restart = true;

  return helpers.apiRequest(channelName, 'GET', 'play', params).then(function(response) {
    return reply(res, 'start-playing', response.data);
  }).catch(function(err) {
    return reply(res, 'general-error');
  });
}

module.exports = {
  play: function(res, item, options) {
    var playItem = item;

    if (item.type === 'show') {
      var currentEpisode = item.meta && item.meta.currentEpisode;
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
