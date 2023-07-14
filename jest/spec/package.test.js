const https = require('node:https');
const semver = require('semver');

describe('package.json', () => {
  test('version', (done) => {
    const { version: thisVersion } = require('../../package.json');
    const url = 'https://raw.githubusercontent.com/tokghwt/my-js-action/main/package.json';
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();  // Consume response data to free up memory
        done(new Error(`${res.statusCode} ${res.statusMessage} (${url})`));
        return;
      }
      res.setEncoding('utf8');
      let jsonData = '';
      res.on('data', (chunk) => {
        jsonData += chunk;
      });
      res.on('end', () => {
        try {
          const { version: latestVersion } = JSON.parse(jsonData);
          expect(semver.gt(thisVersion, latestVersion)).toBeTruthy();
          done();
        } catch (error) {
          done(error);
        }
      });
    }).on('error', (error) => {
      done(error);
    });
  });
});
