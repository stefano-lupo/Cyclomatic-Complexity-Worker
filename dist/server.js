'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _WorkerController = require('./controllers/WorkerController');

var WorkerController = _interopRequireWildcard(_WorkerController);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv2.default.config();

// Import Controllers


// Create Server
var app = (0, _express2.default)();
app.use(_bodyParser2.default.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded for req.body
app.use(_bodyParser2.default.json()); // Parses application/json for req.body
app.use((0, _morgan2.default)('dev'));

// Initialize the DB
// const dbURL = "mongodb://localhost/dfs_directoryService";
// mongoose.connect(dbURL);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log("Connected to Database");
// });


// API endpoints
app.post('/job', WorkerController.createJob);
app.get('/ping', function (req, res) {
  res.send({ message: 'Online' });
});

// Initialize the Server
var port = process.argv[4] || process.env.DEFAULT_PORT;
app.set('downloadsDir', 'downloads/' + port);
app.listen(port, function () {
  console.log('Cyclomatic Complexity Worker on port ' + port);
});