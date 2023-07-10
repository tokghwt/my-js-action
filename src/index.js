const core = require('@actions/core');
const github = require('@actions/github');

try {
  core.debug(`"github.context": ${JSON.stringify(github.context, null, 2)}`);
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false});
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.info(`"regexp for check": ${String(regexp)}`);
  core.info(`"commit SHA": "${github.context.sha}"`);
  core.info(`"event name": "${github.context.eventName}"`);
  if (github.context.eventName === 'pull_request') {
    core.info(`"activity type": "${github.context.payload.action}"`);
    core.info(`"pull request title": "${github.context.payload.pull_request.title}"`);
    if (!regexp.test(github.context.payload.pull_request.title)) {
      throw new Error(`Incorrect format pull request title ("${github.context.payload.pull_request.title}")`);
    }
  } else if (github.context.eventName === 'push') {
    for (const commit of github.context.payload.commits) {
      core.info(`"git ref": "${github.context.payload.ref}"`);
      const lfIndex = commit.message.indexOf('\n');
      const message = (lfIndex >= 0) ? commit.message.slice(0, lfIndex) : commit.message;
      core.info(`"commit message": "${message}"`);
      if (!regexp.test(commit.message)) {
        throw new Error(`Incorrect format commit message (${commit.message})`);
      }
    }
  } else {
    throw new Error(`Unsupported event (${github.context.eventName})`);
  }
} catch (error) {
  core.setFailed(error.message);
}
