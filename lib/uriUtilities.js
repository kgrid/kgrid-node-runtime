const URI = require('uri-js');

function createUri(path) {
  path = resolveRelativePath(path);
  let uri = URI.parse(path);
  uri = addScheme(uri);
  return uri
}

function resolveRelativePath(path) {
  if (!path.startsWith('file') || !path.startsWith('http')) {
    let currentDirectory = process.cwd() + '/';
    path = URI.resolve(currentDirectory, path)
    return path;
  }
}

function addScheme(uri) {
  if (!uri.scheme) {
    uri.scheme = 'file';
  }
  return uri
}

function uriToString(uri) {
  return `${uri.scheme}://${uri.host || ''}${uri.path}`
}

function getFilename(uri) {
  return uri.path.slice(uri.path.lastIndexOf('/'), uri.path.length)
}

module.exports = {
  createUri: createUri,
  uriToString: uriToString,
  getFilename: getFilename
}
