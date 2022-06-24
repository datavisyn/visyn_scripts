const { call } = require('./utils');

module.exports = {
  command: 'copy',
  describe: 'Copy assets, styles, and static files to the dist folder',
  handler: () => {
    call('if [ -d src/assets ]; then cp -rv src/assets/. dist/assets/; fi && if [ -d src/template ]; then shx --verbose cp -R src/template/. dist/template/; fi');
    call('if [ -d src/scss ]; then shx --verbose cp -R src/scss/. dist/scss/; fi');
    call('shx --verbose cp src/*.{txt,html,ejs,json} dist/ || echo \'no file copied\'');
  },
};
