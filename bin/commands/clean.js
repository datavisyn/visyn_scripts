import { call } from "./utils.js";

export default {
  command: 'clean [strings...]',
  describe: 'Clean files and folders using rimraf',
  handler: (args) => {
    call('rimraf', (args.strings || []).join(' '));
  },
};
