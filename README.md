# Cyclomatic Complexity Worker
This repository contains the code for the worker nodes to be run in conjunction with [the master server](https://github.com/stefano-lupo/Cyclomatic-Complexity-Server). These worker nodes are responsible for pulling down a specified repository, requesting work from the master server, computing the cyclomatic complexity of the file specified by the master server and returning that value to the master server.

*Note node_modules has latest version of `escomplex`. That package seems to no longer be maintained on NPM but has a much newer version on github.*

## Implementation
The worker's run a tiny REST API written in Node using Express in order to communicate with the master server.
The API exposes two endpoints: `GET /ping` and `POST /job`. They use the  [node-git](https://github.com/nodegit/nodegit) library for cloning remote repositories and interacting with them locally. They also use [this fork of escomplex](https://github.com/escomplex/escomplex) in order to calculate the cyclomatic complexity of files.

## GET /ping
This endpoint is simply used as a heartbeat sensor so that the master server knows if this worker is currently up. 
Upon receipt of this ping, the worker simply responds with `200 OK`.

## POST /job
The master server makes a POST request to the workers with a body containing a `repoHash`, `repoName` and `repoOwner`. 
The worker then clones the remote repository (using node-git) into a local temporary directory (the impact of this design choice is discussed [here](https://github.com/stefano-lupo/Cyclomatic-Complexity-Server#getting-workers-to-clone-entire-repositories)).

Once the repository is cloned, the worker then requests work from the master server in the `getWork()` function.

## `getWork()`
This function makes a `GET /work` request to the master server who will in turn respond with either a `{finished: true}` indicating there is no more work, or a `{repoHash, commitSha, file}` indicating that the `file` contained in commit `commitSha` of repo `repoHash` must be processed.

At this point the worker proceeds to compute the cyclomatic complexity of said file.

Upon completion, the worker makes a `POST /cyclomatic` request to the master containing `{repoHash, commitSha, file, cyclomatic}` allowing this result to find its home.

Finally another call to `getWork()` is made and the process repeats.



