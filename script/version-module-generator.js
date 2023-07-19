const { writeFileSync } = require('node:fs');

writeFileSync(process.argv[2], `module.exports = '${process.env.npm_package_version}';`);
