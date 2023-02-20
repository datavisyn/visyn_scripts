# visyn_scripts

[![NPM version](https://badge.fury.io/js/visyn_scripts.svg)](https://npmjs.org/package/visyn_scripts)
[![build](https://github.com/datavisyn/visyn_scripts/actions/workflows/build.yml/badge.svg)](https://github.com/datavisyn/visyn_scripts/actions/workflows/build.yml)

This package includes scripts and configuration files used by [datavisyn](https://datavisyn.io/) repositories. Collecting everything in a single installable repository unifies configurations across many repositories, thus reducing the maintenance overhead.

## Usage

Install visyn_scripts via npm: `npm i --save-dev git+ssh://git@github.com/datavisyn/visyn_scripts.git#develop`

Add visyn_scripts to your package.json scripts, i.e. add `"compile": "visyn_scripts compile"` and execute it with `npm run compile`, or alternatively directly execute it with `npx visyn_scripts compile`.

## Scripts

The main purpose of visyn_scripts are the unified scripts:

### build

Builds a workspace using webpack.

### compile

Builds a repository using typescript.

### copy

Copies assets, styles, and static files to the dist folder.

### docs

Generates docs of a repository using typedoc.

### lint

Lints a repository using ESLint.

### test

Tests a repository using Jest.

## Configurations

visyn_scripts also includes default configurations for ESLint, Prettier, Typescript, ...
To integrate them in an existing repository, simply switch to `.js` configurations and reexport the configurations found in visyn_scripts. This way, any editor will look for a `.prettierrc.js` in the repository, and will find one exporting the common configuration.

```javascript
module.exports = require('visyn_scripts/config/prettierrc.template');
```

## FAQ

...

---

<a href="https://www.datavisyn.io"><img src="https://www.datavisyn.io/wp-content/uploads/2021/11/datavisyn_RGB_A.svg" align="left" width="200px" hspace="10" vspace="6"></a>
