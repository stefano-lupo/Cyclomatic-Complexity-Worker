let availableWorkers = ['http://localhost:5001'];

export const calculateComplexity = async (req, res) => {
  const { repoUrl, repoName, repoOwner } = req.body;

  if(repoUrl) {
    console.log(repoUrl);
    return res.send("thanks!");
  }

  console.log(`Onwer: ${repoOwner}, Name: ${repoName}`);
  return res.send("Thanks!");
};
