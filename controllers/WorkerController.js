import Git from 'nodegit';
import escomplex from 'escomplex';
import fs from 'fs';
import rimraf from 'rimraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_BASE_URL = "https://github.com";
const { MASTER } = process.env;
const repos = new Map();


/**
 * Parameters for accessing Github API with my api key
 */
const token = process.env.GITHUB_KEY;
const cloneURL = `https://${token}:x-oauth-basic@github.com`;
const cloneOptions = {
  fetchOpts: {
    callbacks: {
      certificateCheck: () => { return 1; },
      credentials: () => {
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
export const createJob = async (req, res) => {

  // Extract repository information
  const { repoHash, repoName, repoOwner } = req.body;
  const url = `${cloneURL}/${repoOwner}/${repoName}`;

  // Clone repository
  console.log(`Cloning ${url}...`);
  const repoPath = `downloads/${repoOwner}_${repoName}`;
  if(fs.existsSync(repoPath)) {
    console.log(`Deleting old copy of ${repoOwner}_${repoName}`);
    rimraf.sync(repoPath);
  }
  Git.Clone(url, repoPath, cloneOptions)
    .then((repository) => {
      // Repository object here is a disaster.. so dont save it, but it is cloned..
      // Just save path it was cloned to and we can open it with that later
      repos.set(repoHash, { repoPath, numProcessed: 0, numFailed: 0 });
      res.send({message: `Successfully cloned repo`});

      getWork();
    })
    .catch(err => {
      console.error(err);
      return res.status(400).send({message: err.toString()});
    })
  ;
};


/**
 * Checks with master to see if any work is available and performs that work if there is
 */
//TODO: Implement nicer way of sleeping worker etc
async function getWork() {

  // Check if there is any work there
  const { ok, status, response } = await makeRequest(`${MASTER}/work`, "get");
  const { finished, repoHash, commitSha, file, } = response;


  // If master responded with finished: recursive calls for this processing thread are finished
  // Should probably delete repo here
  if(finished) {

    const { repoPath, numProcessed, numFailed } = repos.get(repoHash);
    console.log(repoPath, numProcessed, numFailed);

    if(fs.existsSync(repoPath)) {
      console.log(`Deleting old copy of ${repoPath}`);
      rimraf.sync(repoPath);
    }
    console.log(`Total Processed = ${numProcessed}, Total Failed = ${numFailed}`);
    return;
  }

  console.log(`Looking for ${repoHash}:  ${commitSha} - ${file}`);
  const repoEntry = repos.get(repoHash);


  // Open the repository
  let entry;
  Git.Repository.open(repoEntry.repoPath)
    .then(function(repo) {
      return repo.getCommit(commitSha);
    })
    .then(function(commit) {
      return commit.getEntry(file);
    })
    .then(function(entryResult) {
      entry = entryResult;
      return entry.getBlob();
    })
    .done(async function(blob) {
      // Compute the cyclomatic complexity
      let cyclomatic;
      try {
        cyclomatic = getCyclomaticComplexity(String(blob));
      } catch (err) {
        // Library sometimes stuggles with files with weird js mixins that it doesnt recognise
        // Returning -1 here means these files will be skipped
        console.error(err);
        repoEntry.numFailed ++;
        cyclomatic = -1;
      }

      // Send results back to master
      const body = { repoHash, commitSha, file, cyclomatic };
      const { ok, status, response } = await makeRequest(`${MASTER}/cyclomatic`, "post", body);
      repoEntry.numProcessed++;
      console.log(`\n`);

      // Go back and process some more.
      return getWork();
    });
}

/**
 * Computes cyclomatic complexity of the passed in string
 * Ideally this would be a file that it reads using a stream but time = nowhere to be found
 * @param fileStr string representation of the file
 * @returns {*}
 */
function getCyclomaticComplexity(fileStr) {
  const result = escomplex.analyse(fileStr, {}).aggregate.cyclomatic;
  console.log(`Cyclomatic complexity of file: ${result}`);
  return result
}


/**
 * Makes a request to the given endpoint
 * @param endpoint url of endpoint
 * @param method get/post etc
 * @param body if using post
 */
async function makeRequest(endpoint, method, body) {
  const headers =  {'Content-Type': 'application/json'};
  let response;
  if(body) {
    response = await fetch(endpoint, {method, body: JSON.stringify(body), headers});
  } else {
    response = await fetch(endpoint, {method, headers})
  }

  const { ok, status } = response;


  const contentType = response.headers.get("content-type");
  if(contentType && contentType.indexOf("application/json") !== -1) {
    response = await response.json();
  }

  return {ok, status, response}
}
