import { call } from "./utils.js";

export default {
  command: 'test [strings...]',
  describe: 'Test a repository using Jest',
  builder: (yargs) => yargs.option('passWithNoTests', {
    default: true,
    type: 'boolean',
  }),
  handler: (args) => {
    call('jest', `${args.passWithNoTests ? '--passWithNoTests' : ''} ${(args.strings || []).join(' ')}`);
  },
};
