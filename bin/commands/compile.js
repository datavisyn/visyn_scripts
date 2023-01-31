import { call } from "./utils.js";

export default {
  command: 'compile [strings...]',
  describe: 'Build a repository using typescript',
  handler: (args) => {
    call('tsc', `${(args.strings || []).join(' ')}`);
  },
};
