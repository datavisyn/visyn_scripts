import { resolve } from "path";
import { call, dirname } from "./utils.js";

export default {
  command: 'start [strings...]',
  describe: 'Start webpack serve',
  handler: (args) => {
    const configPath = resolve(dirname, '../../config/webpack.config.js');
    call('webpack', `serve --mode development --config "${configPath}" --progress ${(args.strings || []).join(' ')}`);
  },
};
