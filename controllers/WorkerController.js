import Git from 'nodegit';
import escomplex from 'escomplex';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_BASE_URL = "https://github.com";
const MASTER = "http://localhost:5000/api";



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
  const { repoUrl, repoName, repoOwner } = req.body;
  const url = `${cloneURL}/${repoOwner}/${repoName}`;
  console.log(`Cloning ${url}...`);
  Git.Clone(url, `downloads/${repoName}-${new Date().getTime()/1000}`, cloneOptions)
    .then((repository) => {
      // Work with the repository object here.
      res.send({message: `Successfully cloned repo`});
      // return;
      // processRepo(repository, repoUrl);
    })
    .catch(err => {
      console.error(err);
      return res.status(400).send({message: err.toString()});
    })
  ;
};

async function processRepo(repo, repoUrl) {
  console.log(`Processing: ${repo.path()}`);

  const { ok, status, response } = await makeRequest(`${MASTER}/work`, "post", {repoUrl});

  if(response.finished) {
    return;
  }

  const { commitSha, file } = response;
  console.log(`Looking for ${commitSha} - ${file}`);

  repo.getCommit(commitSha)
    .then(commit => {
      console.log("Got commit");
      return commit.getEntry(file);
    }).then(entry => {
      console.log("Got entry");
      return entry.getBlob().then(function(blob) {
        blob.entry = entry;
        return blob;
      });
  }).then(blob => {
    const cyclomatic = getCyclomaticComplexity(String(blob));
  }).catch(error => {
    console.error(error);
  })
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

  console.log(`Got ${status}`);

  const contentType = response.headers.get("content-type");
  if(contentType && contentType.indexOf("application/json") !== -1) {
    console.log("jsoning");
    response = await response.json();
  }

  return {ok, status, response}

}
