import Git from 'nodegit';

const GITHUB_BASE_URL = "https://github.com";

/**
 * POST /job
 * body: {repoUrl}
 * Gets the worker to clone the given repo
 */
export const createJob = async (req, res) => {
  const { repoUrl, repoName, repoOwner } = req.body;
  console.log(`Cloning ${repoUrl}...`);
  Git.Clone(repoUrl, `downloads/${repoName}-${new Date().getTime()/1000}`)
    .then((repository) => {
      // Work with the repository object here.
      console.log("Done");
      return res.send({message: `Successfully cloned repo`});
    })
    .catch(err => {
      console.error(err);
      return res.status(400).send({message: err.toString()});
    })
  ;
};



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
