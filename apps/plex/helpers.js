var request = require('request-promise');
require('dotenv').load();

function apiUrl(path) {
  return process.env.HOMER_ADDRESS + '/api/plex/' + path;
};

function params(paramsObject) {
  return Object.keys(paramsObject).map(function(key) {
    return key + '=' + paramsObject[key];
  }).join('&');
};

exports.apiRequest = function(method, path, body) {
  method = method.toUpperCase();
  var url = apiUrl(path) + (method === 'GET'
    ? '?' + params(body)
    : ''
  );

  console.log('url', url);

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
};
