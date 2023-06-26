const core = require('@actions/core');
const github = require('@actions/github');

try {
  core.debug(`github.context: ${JSON.stringify(github.context, null, 2)}`);
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.info(`input regexp: ${String(regexp)}`);
  core.info(`event name: ${github.context.eventName}`);
  core.info(`activity type: ${github.context.payload.action}`);
  if (github.context.eventName === 'push') {
    for (const commit of github.context.payload.commits) {
      core.info(`commit message: "${commit.message}"`);
      if (!regexp.test(commit.message)) {
        throw new Error(`Incorrect format commit message ("${commit.message}")`);
      }
    }
  } else if (github.context.eventName === 'pull_request' || github.context.eventName === 'pull_request_target') {
    core.info(`pull request title: "${github.context.payload.pull_request.title}"`);
    if (!regexp.test(github.context.payload.pull_request.title)) {
      throw new Error(`Incorrect format pull request title ("${github.context.payload.pull_request.title}")`);
    }
  }
} catch (error) {
  core.setFailed(error.message);
}
