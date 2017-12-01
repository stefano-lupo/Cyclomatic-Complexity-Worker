import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import morgan from 'morgan';

// Import Controllers
import * as WorkerController from './controllers/WorkerController';

// Create Server
const app = express();
app.use(bodyParser.urlencoded({extended: true}));   // Parses application/x-www-form-urlencoded for req.body
app.use(bodyParser.json());                         // Parses application/json for req.body
app.use(morgan('dev'));


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


// Initialize the Server
app.listen(5001, () => {
  console.log('Cyclomatic Complexity Worker on port 5001');
});
