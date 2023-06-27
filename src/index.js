const core = require('@actions/core');
const github = require('@actions/github');

try {
  core.debug(`github.context: ${JSON.stringify(github.context, null, 2)}`);
  core.info(`event name: ${github.context.eventName}`);
  if (github.context.eventName === 'pull_request') {
    core.info(`activity type: ${github.context.payload.action}`);
    core.info(`pull request title: "${github.context.payload.pull_request.title}"`);
    const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
    const flags = core.getInput('flags');
    const regexp = new RegExp(pattern, flags);
    core.info(`input regexp: ${String(regexp)}`);
    if (!regexp.test(github.context.payload.pull_request.title)) {
      throw new Error(`Incorrect format pull request title ("${github.context.payload.pull_request.title}")`);
    }
  }
} catch (error) {
  core.setFailed(error.message);
}
