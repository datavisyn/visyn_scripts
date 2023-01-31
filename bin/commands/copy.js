import { call } from "./utils.js";

export default {
  command: 'copy',
  describe: 'Copy assets, styles, and static files to the dist folder',
  handler: () => {
    call('shx', "--verbose cp -r src/assets/. dist/assets/ || echo 'no assets copied'");
    call('shx', "--verbose cp -R src/template/. dist/template/ || echo 'no template copied'");
    call('shx', "--verbose cp -R src/templates/. dist/templates/ || echo 'no templates copied'");
    call('shx', "--verbose cp -R src/scss/. dist/scss/ || echo 'no scss files copied'");
    call('shx', '--verbose cp "src/*.{txt,html,ejs,json}" dist/ || echo \'no file copied\'');
  },
};
