const core = require('@actions/core');
const github = require('@actions/github');

try {
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.debug(`core.debug: regexp: ${regexp}`);
  console.log('console.log: regexp:', regexp);
  //const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log('console.log: github.context:', github.context);
  for (const commit of github.context.payload.commits) {
    console.log('console.log: commit message:', commit.message);
  }
} catch (error) {
  core.setFailed(error.message);
}
