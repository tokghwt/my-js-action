const core = require('@actions/core');
const github = require('@actions/github');

try {
  const version = require('./version');
  core.info(`"version": "${version}"`);
  core.debug(`"github.context": ${JSON.stringify(github.context, null, 2)}`);
  const pattern = core.getInput('pattern', { required: true, trimWhitespace: false });
  const flags = core.getInput('flags');
  const regexp = new RegExp(pattern, flags);
  core.info(`"regexp for check": ${String(regexp)}`);
  core.info(`"actor": "${github.context.actor}"`);
  core.info(`"event name": "${github.context.eventName}"`);
  if (github.context.eventName === 'push') {
    core.info(`"git ref": "${github.context.payload.ref}"`);
    for (const commit of github.context.payload.commits) {
      const lfIndex = commit.message.indexOf('\n');
      const title = (lfIndex >= 0) ? commit.message.slice(0, lfIndex) : commit.message;
      core.info(`"commit title": "${title}"`);
      if (!regexp.test(title)) {
        throw new Error(`Invalid commit title ("${title}")`);
      }
    }
  } else if (github.context.eventName === 'pull_request') {
    core.info(`"activity type": "${github.context.payload.action}"`);
    core.info(`"pull request title": "${github.context.payload.pull_request.title}"`);
    if (!regexp.test(github.context.payload.pull_request.title)) {
      throw new Error(`Invalid pull request title ("${github.context.payload.pull_request.title}")`);
    }
  } else {
    throw new Error(`Unsupported event ("${github.context.eventName}")`);
  }
} catch (error) {
  core.setFailed(error.message);
}
