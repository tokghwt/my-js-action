const core = require('@actions/core');
const github = require('@actions/github');

try {
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  console.log('regexp:', regexp);
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  for (const commit of payload.commits) {
    console.log('commit message:', commit.message);
  }
} catch (error) {
  core.setFailed(error.message);
}
