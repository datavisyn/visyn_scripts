import GeneratorUtils from "./generator/utils/GeneratorUtils";

export default {
  command: 'workspace-clone <product>',
  aliases: ['w:c'],
  describe: 'Sets up a workspace using a product repository',
  builder: (yargs) => yargs
    .option('ssh', {
      default: true,
      type: 'boolean',
    })
    .option('branch', {
      required: true,
      alias: 'b',
      type: 'string',
    })
    .option('skip', {
      default: '',
      type: 'string',
    }),
  handler: async (args) => {
    await GeneratorUtils.yo('setup-workspace', args);
  },
};
