const GeneratorUtils = require('./generator/utils/GeneratorUtils');

module.exports = {
  command: 'workspace-update',
  aliases: ['w:u'],
  describe: 'Updates a workspace',
  handler: async () => {
    await GeneratorUtils.yo('workspace', {});
  },
};
