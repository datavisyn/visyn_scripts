import { resolve } from "path";
import { call, dirname } from "./utils.js";


export default {
  command: 'build [strings...]',
  describe: 'Build a workspace using webpack',
  handler: (args) => {
    const configPath = resolve(dirname, '../../config/webpack.config.js');
    call('webpack', `--config "${configPath}" ${(args.strings || []).join(' ')}`, {
      env: {
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    });
  },
};
