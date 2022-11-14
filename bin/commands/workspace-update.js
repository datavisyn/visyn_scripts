const GeneratorUtils = require('./generator/utils/GeneratorUtils');

module.exports = {
  command: 'workspace-update',
  aliases: ['w:u'],
  describe: 'Updates a workspace',
  builder: (yargs) => yargs
    .option('noAdditionals', {
      default: false,
      type: 'boolean',
    })
    .option('defaultApp', {
      default: 'phovea',
      type: 'string',
      description: 'Default application for the workspace',
    })
    .option('addWorkspaceRepos', {
      default: true,
      type: 'boolean',
      description: 'States whether workspace repos should be part of the dependencies. Set to `true` for local development setup. Otherwise `false` for CI build process.',
    }),
  handler: async (args) => {
    await GeneratorUtils.yo('workspace', args);
  },
};
