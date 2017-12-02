'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createJob = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

/**
 * Checks with master to see if any work is available and performs that work if there is
 */
//TODO: Implement nicer way of sleeping worker etc
var getWork = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var _ref3, ok, status, response, finished, repoHash, commitSha, file, _repos$get, repoPath, numProcessed, numFailed, repoEntry, entry;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return makeRequest(MASTER + '/work', "get");

          case 2:
            _ref3 = _context3.sent;
            ok = _ref3.ok;
            status = _ref3.status;
            response = _ref3.response;
            finished = response.finished, repoHash = response.repoHash, commitSha = response.commitSha, file = response.file;

            // If master responded with finished: recursive calls for this processing thread are finished
            // Should probably delete repo here

            if (!finished) {
              _context3.next = 13;
              break;
            }

            _repos$get = repos.get(repoHash), repoPath = _repos$get.repoPath, numProcessed = _repos$get.numProcessed, numFailed = _repos$get.numFailed;

            console.log(repoPath, numProcessed, numFailed);

            if (_fs2.default.existsSync(repoPath)) {
              console.log('Deleting old copy of ' + repoPath);
              _rimraf2.default.sync(repoPath);
            }
            console.log('Total Processed = ' + numProcessed + ', Total Failed = ' + numFailed);
            return _context3.abrupt('return');

          case 13:

            console.log('Looking for ' + repoHash + ':  ' + commitSha + ' - ' + file);
            repoEntry = repos.get(repoHash);

            // Open the repository

            entry = void 0;

            _nodegit2.default.Repository.open(repoEntry.repoPath).then(function (repo) {
              return repo.getCommit(commitSha);
            }).then(function (commit) {
              return commit.getEntry(file);
            }).then(function (entryResult) {
              entry = entryResult;
              return entry.getBlob();
            }).done(function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(blob) {
                var cyclomatic, body, _ref5, ok, status, response;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        // Compute the cyclomatic complexity
                        cyclomatic = void 0;

                        try {
                          cyclomatic = getCyclomaticComplexity(String(blob));
                        } catch (err) {
                          // Library sometimes stuggles with files with weird js mixins that it doesnt recognise
                          // Returning -1 here means these files will be skipped
                          console.error(err);
                          repoEntry.numFailed++;
                          cyclomatic = -1;
                        }

                        // Send results back to master
                        body = { repoHash: repoHash, commitSha: commitSha, file: file, cyclomatic: cyclomatic };
                        _context2.next = 5;
                        return makeRequest(MASTER + '/cyclomatic', "post", body);

                      case 5:
                        _ref5 = _context2.sent;
                        ok = _ref5.ok;
                        status = _ref5.status;
                        response = _ref5.response;

                        repoEntry.numProcessed++;
                        console.log('\n');

                        // Go back and process some more.
                        return _context2.abrupt('return', getWork());

                      case 12:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x3) {
                return _ref4.apply(this, arguments);
              };
            }());

          case 17:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getWork() {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Computes cyclomatic complexity of the passed in string
 * Ideally this would be a file that it reads using a stream but time = nowhere to be found
 * @param fileStr string representation of the file
 * @returns {*}
 */


/**
 * Makes a request to the given endpoint
 * @param endpoint url of endpoint
 * @param method get/post etc
 * @param body if using post
 */
var makeRequest = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee4(endpoint, method, body) {
    var headers, response, _response, ok, status, contentType;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            headers = { 'Content-Type': 'application/json' };
            response = void 0;

            if (!body) {
              _context4.next = 8;
              break;
            }

            _context4.next = 5;
            return (0, _nodeFetch2.default)(endpoint, { method: method, body: JSON.stringify(body), headers: headers });

          case 5:
            response = _context4.sent;
            _context4.next = 11;
            break;

          case 8:
            _context4.next = 10;
            return (0, _nodeFetch2.default)(endpoint, { method: method, headers: headers });

          case 10:
            response = _context4.sent;

          case 11:
            _response = response, ok = _response.ok, status = _response.status;
            contentType = response.headers.get("content-type");

            if (!(contentType && contentType.indexOf("application/json") !== -1)) {
              _context4.next = 17;
              break;
            }

            _context4.next = 16;
            return response.json();

          case 16:
            response = _context4.sent;

          case 17:
            return _context4.abrupt('return', { ok: ok, status: status, response: response });

          case 18:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function makeRequest(_x4, _x5, _x6) {
    return _ref6.apply(this, arguments);
  };
}();

var _nodegit = require('nodegit');

var _nodegit2 = _interopRequireDefault(_nodegit);

var _escomplex = require('escomplex');

var _escomplex2 = _interopRequireDefault(_escomplex);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

_dotenv2.default.config();

var GITHUB_BASE_URL = "https://github.com";
var MASTER = process.env.MASTER;

var repos = new Map();

/**
 * Parameters for accessing Github API with my api key
 */
var token = process.env.GITHUB_KEY;
var cloneURL = 'https://' + token + ':x-oauth-basic@github.com';
var cloneOptions = {
  fetchOpts: {
    callbacks: {
      certificateCheck: function certificateCheck() {
        return 1;
      },
      credentials: function credentials() {
        return NodeGit.Cred.userpassPlaintextNew(token, 'x-oauth-basic');
      }
    }
  }
};

/**
 * POST /job
 * body: {repoUrl}
 * Gets the worker to clone the given repo
 */
var createJob = exports.createJob = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
    var _req$body, repoHash, repoName, repoOwner, url, downloadsDir, repoPath;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            // Extract repository information
            _req$body = req.body, repoHash = _req$body.repoHash, repoName = _req$body.repoName, repoOwner = _req$body.repoOwner;
            url = cloneURL + '/' + repoOwner + '/' + repoName;

            // Clone repository

            console.log('Cloning ' + url + '...');
            downloadsDir = req.app.get('downloadsDir');
            repoPath = downloadsDir + '/' + repoOwner + '_' + repoName;

            if (_fs2.default.existsSync(repoPath)) {
              console.log('Deleting old copy of ' + repoOwner + '_' + repoName);
              _rimraf2.default.sync(repoPath);
            }
            _nodegit2.default.Clone(url, repoPath, cloneOptions).then(function (repository) {
              // Repository object here is a disaster.. so dont save it, but it is cloned..
              // Just save path it was cloned to and we can open it with that later
              repos.set(repoHash, { repoPath: repoPath, numProcessed: 0, numFailed: 0 });
              res.send({ message: 'Successfully cloned repo' });

              getWork();
            }).catch(function (err) {
              console.error(err);
              return res.status(400).send({ message: err.toString() });
            });

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createJob(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();function getCyclomaticComplexity(fileStr) {
  var result = _escomplex2.default.analyse(fileStr, {}).aggregate.cyclomatic;
  console.log('Cyclomatic complexity of file: ' + result);
  return result;
}