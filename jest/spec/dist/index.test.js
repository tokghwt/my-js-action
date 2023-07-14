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
  const pkg = require('../../../package.json');
  process.env.GITHUB_EVENT_PATH = './jest/temp/payload.json';
  const testList = [
    /*
     * ["inputs.pattern", "inputs.flags", [commit message list], "error message"]
     */
    ['^(feat|fix): ', 'i', ['feat: Add ...', 'Fix: Change ...']],
    [undefined, 'i', ['feat: Add ...', 'Fix: Change ...']],
    ['^(feat|fix): ', 'i', ['feat: Add ...', 'Fix:Change ...'], 'Incorrect format commit message (Fix:Change ...)'],
    ['^(feat|fix): ', undefined, ['feat: Add ...', 'Fix: Change ...'], 'Incorrect format commit message (Fix: Change ...)'],
    ['^(feat|fix): ', undefined, ['feat: Add ...\n\ndescription.']],
    ['^(feat|fix): ', undefined, ['Add ...\n\ndescription.'], 'Incorrect format commit message (Add ...%0A%0Adescription.)'],
  ];
  for (let i = 0; i < testList.length; i++) {
    const testNum = i + 1;
    const pattern = testList[i][0];
    const flags = testList[i][1];
    const messages = testList[i][2];
    const errmsg = testList[i][3];
    test(`${testNum}. pattern:${s(pattern)},flags:${s(flags)},messages:${s(messages)},errmsg:${s(errmsg)}`, () => {
      process.env.INPUT_PATTERN = '^(?:feat|fix)(?:\([^)]+\))?: '  // action.yml inputs.pattern.default
      delete process.env.INPUT_FLAGS;
      if (pattern !== undefined) {
        process.env.INPUT_PATTERN = pattern;
      }
      if (flags !== undefined) {
        process.env.INPUT_FLAGS = flags;
      }
      process.env.GITHUB_EVENT_NAME = 'push';
      const payload = {
        commits: messages.map((message) => ({ message })),
        ref: 'refs/heads/main'
      };
      writeFileSync(process.env.GITHUB_EVENT_PATH, s(payload));
      require('../../../../my-js-action');
      const lines = logString.replace(/\r\n/g, '\n').split('\n');
      let lineNum = 0;
      expect(lines[lineNum++]).toBe(`"version": "${pkg.version}"`);
      expect(lines[lineNum++]).toMatch(/^::debug::"github.context": /);
      expect(lines[lineNum++]).toBe(`"regexp for check": ${String(new RegExp(process.env.INPUT_PATTERN, process.env.INPUT_FLAGS))}`);
      expect(lines[lineNum++]).toBe(`"event name": "${process.env.GITHUB_EVENT_NAME}"`);
      expect(lines[lineNum++]).toBe(`"git ref": "${payload.ref}"`);
      for (const commit of payload.commits) {
        const lfIndex = commit.message.indexOf('\n');
        const message = (lfIndex >= 0) ? commit.message.slice(0, lfIndex) : commit.message;
        expect(lines[lineNum++]).toBe(`"commit message": ${s(message)}`);
        if (errmsg !== undefined) {
          if (lines[lineNum].startsWith('::error::')) {
            expect(lines[lineNum++]).toBe(`::error::${errmsg}`);
            expect(lines[lineNum++]).toBe('');
            expect(lineNum).toBe(lines.length);
            return;
          }
        }
      }
      expect(lines[lineNum++]).toBe('');
      expect(lineNum).toBe(lines.length);
      if (errmsg !== undefined) {
        throw new Error('No error occuered');
      }
      return;
    });
  }
});
