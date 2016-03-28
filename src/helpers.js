var request = require('request-promise');
require('dotenv').load();

function apiUrl(channel, path) {
  // TODO: Use global event endpoiont in homer so flow handler can deal with responses
  return process.env.HOMER_ADDRESS + '/api/' + channel + '/' + path;
};

function params(paramsObject) {
  return Object.keys(paramsObject).map(function(key) {
    return key + '=' + paramsObject[key];
  }).join('&');
};

function apiRequest(method, channel, path, body) {
  method = method.toUpperCase();
  var url = apiUrl(channel, path);

  if (body) {
    url = url + (method === 'GET'
      ? '?' + params(body)
      : ''
    );
  }

  var requestOptions = {
    method: method,
    uri: url,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    json: true
  };

  if (method !== 'GET') requestOptions.body = body;

  return request(requestOptions);
}

module.exports = {
  api: {
    get: function(channel, path, body) {
      return apiRequest('GET', channel, path, body);
    },

    put: function(channel, path, body) {
      return apiRequest('PUT', channel, path, body);
    },

    post: function(channel, path, body) {
      return apiRequest('POST', channel, path, body);
    }
  }
};
