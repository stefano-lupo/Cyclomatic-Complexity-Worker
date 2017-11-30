import Git from 'nodegit';
import escomplex from 'escomplex';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({path: `../${__dirname}/.env`});
console.log(process.env);

const GITHUB_BASE_URL = "https://github.com";
const MASTER = "http://localhost:5000/api";


/**
 * Parameters for accessing Github API with my api key
 */
const token = "githubtoken";
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


const repos = new Map();


/**
 * POST /job
 * body: {repoUrl}
 * Gets the worker to clone the given repo
 */
export const createJob = async (req, res) => {
  const { repoHash, repoName, repoOwner } = req.body;
  const url = `${cloneURL}/${repoOwner}/${repoName}`;
  console.log(`Cloning ${url}...`);
  const repoLocation = `downloads/${repoName}-${new Date().getTime()/1000}`;
  Git.Clone(url, repoLocation, cloneOptions)
    .then((repository) => {
      // Repository object here is a disaster.. so dont save it, but it is cloned..
      repos.set(repoHash, repoLocation);
      res.send({message: `Successfully cloned repo`});
      console.log(`Waiting 2s to request work`);
      setTimeout(() => {
        process();
      }, 2000);
      // process();
    })
    .catch(err => {
      console.error(err);
      return res.status(400).send({message: err.toString()});
    })
  ;
};

async function process() {
  const { ok, status, response } = await makeRequest(`${MASTER}/work`, "get");

  const { finished, repoHash, commitSha, file, } = response;

  if(finished) {
    console.log(`Finished!`);
    return;
  }

  console.log(`Looking for ${repoHash}:  ${commitSha} - ${file}`);
  const repoPath = repos.get(repoHash);
  console.log(`path: ${repoPath}`);

  let entry;
  Git.Repository.open(repoPath)
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
      // Print first 10 lines
      // console.log(blob.toString().split("\n").slice(0, 10).join("\n"));

      const cyclomatic = getCyclomaticComplexity(String(blob));
      const body = { repoHash, commitSha, file, cyclomatic };
      const { ok, status, response } = await makeRequest(`${MASTER}/cyclomatic`, "post", body);
      console.log(`Processed: ${file}`);
      return process();
    });
}

// Note must be <= es6
function getCyclomaticComplexity(fileStr) {
  // const fileStr = fs.readFileSync(file, 'utf-8');
  const result = escomplex.analyse(fileStr, {}).aggregate.cyclomatic;
  console.log(`Cyclomatic complexity of file: ${result}`);
  return result
}

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
