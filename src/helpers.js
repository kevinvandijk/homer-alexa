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

module.exports = {
  apiRequest: function(channel, method, path, body) {
    method = method.toUpperCase();
    var url = apiUrl(channel, path) + (method === 'GET'
      ? '?' + params(body)
      : ''
    );

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
};
