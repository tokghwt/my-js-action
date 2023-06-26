const core = require('@actions/core');
const github = require('@actions/github');

try {
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.info(`regexp: ${String(regexp)}`);
  if (github.context.eventName === 'push') {
    for (const commit of github.context.payload.commits) {
      core.debug(`commit message: "${commit.message}"`);
      if (!regexp.test(commit.message)) {
        throw new Error(`Incorrect format commit message ("${commit.message}")`);
      }
    }
  } else if (github.context.eventName === 'pull_request') {
    core.debug(`pull request title: "${github.context.payload.pull_request.title}"`);
    if (!regexp.test(github.context.payload.pull_request.title)) {
      throw new Error(`Incorrect format pull request title ("${github.context.payload.pull_request.title}")`);
    }
  } else {
    core.info(`github.context: ${JSON.stringify(github.context, null, 2)}`);
  }
} catch (error) {
  core.setFailed(error.message);
}
