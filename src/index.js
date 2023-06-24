const core = require('@actions/core');
const github = require('@actions/github');

try {
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.debug(`regexp: ${regexp}`);
  if (github.context.eventName === 'push') {
    for (const commit of github.context.payload.commits) {
      core.debug('commit message:', commit.message);
      if (!regexp.test(commit.message)) {
        throw new Error(`Wrong format commit message (${commit.message})`);
      }
    }
  } else {
    console.log('github.context:', JSON.stringify(github.context, null, 2));
  }
} catch (error) {
  core.setFailed(error.message);
}
