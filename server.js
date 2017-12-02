import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

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
app.get('/ping', (req, res) => { res.send({message: `Online`})});


// Initialize the Server
const port = process.argv[4] || process.env.DEFAULT_PORT;
app.set('downloadsDir', `downloads/${port}`);
app.listen(port, () => {
  console.log(`Cyclomatic Complexity Worker on port ${port}`);
});
