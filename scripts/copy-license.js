const fs = require('fs');
const path = require('path');
const { license } = require('../package.json');

const packages = fs.readdirSync(path.resolve(__dirname, '../packages'));
packages.forEach((dir) => {
    const pkg = path.resolve(__dirname, '../packages', dir);
    fs.copyFileSync(path.resolve(__dirname, '../LICENSE'), path.resolve(pkg, 'LICENSE'));
    const pkgJsonFile = path.resolve(pkg, 'package.json');
    const pkgJson = fs.readFileSync(pkgJsonFile).toString();
    const newPkgJson = pkgJson.replace(/"license": ".*?"/, `"license": "${license}"`);
    fs.writeFileSync(pkgJsonFile, newPkgJson);
});
