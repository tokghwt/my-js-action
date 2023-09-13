const { writeFileSync } = require('node:fs');

const s = JSON.stringify;

let writeStdout;
let logString;

beforeAll(() => {
  writeStdout = process.stdout.write;
  process.stdout.write = (str) => {
    logString += str;
    return true;
  };
});

afterAll(() => {
  process.stdout.write = writeStdout;
});

beforeEach(() => {
  logString = '';
});

afterEach(() => {
  jest.resetModules();
});

describe('dist/index.js', () => {
  const PACKAGE = require('../../../package.json');
  const ACTOR = 'someone';
  const EVENT_PATH = './jest/temp/payload.json';
  const testList = [
    /*
     * ["inputs.pattern", "inputs.flags", "event", [title list], "error message"]
     */
    ['^type: ', 'i', 'push', ['type: Title', 'TYPE: Title\n\nDesc.']],
    [undefined, 'i', 'push', ['type: Title', 'TYPE: Title\n\nDesc.'], 'Input required and not supplied: pattern'],
    ['^type: ', 'i', 'push', ['type: Title', 'TYPE:Title\n\nDesc.'], 'Invalid commit title ("TYPE:Title")'],
    ['^type: ', undefined, 'push', ['type: Title', 'type: Title\n\nDesc.']],
    ['^type: ', undefined, 'push', ['type: Title', 'TYPE: Title\n\nDesc.'], 'Invalid commit title ("TYPE: Title")'],
    ['^type: ', undefined, 'push', ['Title\n\nDesc.'], 'Invalid commit title ("Title")'],
    ['^type: ', undefined, 'pull_request', ['type: Title']],
    ['^type: ', undefined, 'pull_request', ['Title'], 'Invalid pull request title ("Title")'],
    ['^type: ', undefined, 'issues', ['TYPE: Title'], 'Unsupported event ("issues")'],
  ];
  for (let i = 0; i < testList.length; i++) {
    const testNum = i + 1;
    const pattern = testList[i][0];
    const flags = testList[i][1];
    const event = testList[i][2];
    const titles = testList[i][3];
    const errmsg = testList[i][4];
    test(`${testNum}. pattern:${s(pattern)},flags:${s(flags)},event:${s(event)},titles:${s(titles)},errmsg:${s(errmsg)}`, () => {
      delete process.exitCode;
      if (pattern === undefined) {
        delete process.env.INPUT_PATTERN;
      } else {
        process.env.INPUT_PATTERN = pattern;
      }
      if (flags === undefined) {
        delete process.env.INPUT_FLAGS;
      } else {
        process.env.INPUT_FLAGS = flags;
      }
      process.env.GITHUB_ACTOR = ACTOR;
      process.env.GITHUB_EVENT_NAME = event;
      process.env.GITHUB_EVENT_PATH = EVENT_PATH;
      let payload;
      if (event === 'push') {
        payload = {
          commits: titles.map((title) => ({ message: title })),
          ref: 'refs/heads/main'
        };
      } else if (event === 'pull_request') {
        payload = {
          action: 'opened',
          pull_request: { title: titles[0] }
        };
      } else {
        payload = {};
      }
      writeFileSync(process.env.GITHUB_EVENT_PATH, s(payload));
      require('../../../../my-js-action');
      const lines = logString.replace(/\r\n/g, '\n').split('\n');
      if (errmsg === undefined) {
        expect(process.exitCode).toBe(undefined);
        let lineNum = 0;
        expect(lines[lineNum++]).toBe(`"version": "${PACKAGE.version}"`);
        expect(lines[lineNum++]).toMatch(/^::debug::"github.context": /);
        expect(lines[lineNum++]).toBe(`"regexp for check": ${String(new RegExp(pattern, flags))}`);
        expect(lines[lineNum++]).toBe(`"actor": "${ACTOR}"`);
        expect(lines[lineNum++]).toBe(`"event name": "${event}"`);
        if (event === 'push') {
          expect(lines[lineNum++]).toBe(`"git ref": "${payload.ref}"`);
          for (const commit of payload.commits) {
            const lfIndex = commit.message.indexOf('\n');
            const title = (lfIndex >= 0) ? commit.message.slice(0, lfIndex) : commit.message;
            expect(lines[lineNum++]).toBe(`"commit title": ${s(title)}`);
          }
        } else if (event === 'pull_request') {
          expect(lines[lineNum++]).toBe(`"activity type": "${payload.action}"`);
          expect(lines[lineNum++]).toBe(`"pull request title": "${payload.pull_request.title}"`);
        }
        expect(lines[lineNum++]).toBe('');
        expect(lineNum).toBe(lines.length);
      } else {
        expect(process.exitCode).toBe(1);
        expect(lines[lines.length - 2]).toBe(`::error::${errmsg}`);
        expect(lines[lines.length - 1]).toBe('');
      }
      return;
    });
  }
});
