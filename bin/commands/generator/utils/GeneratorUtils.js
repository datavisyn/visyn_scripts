/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-promise-executor-return */
const path = require('path');
const fs = require('fs-extra');
const yeoman = require('yeoman-environment');
const { isError } = require('lodash');

module.exports = class GeneratorUtils {
  /**
   * Read a key from `.yo-rc.json` in some path
   * @param {*} key Key to read
   * @param {*} cwd Path to file
   */
  static readConfig(key, cwd) {
    const file = fs.readJSONSync(path.join(`${cwd}/.yo-rc.json`));
    return file['generator-phovea'][key];
  }

  /**
   * Creates directory in the given path.
   * @param {string} dir Directory
   */
  static mkdir(dir) {
    return new Promise((resolve) => fs.ensureDir(dir, resolve));
  }

  /**
   * Similar to the composeWith method of the base yeoman generator but it waits shortly till the generator is finished.
   * @param {string} generator Generator name, i.e, `init-lib`.
   * @param {Object} options Options to call the generator with.
   * @param {*} args Arguments to pass to the generator.
   * @param {*} cwd The directory to run the generator in.
   * @param {*} adapter The current generator adapter.
   */
  static yo(generator, options, args, cwd, adapter) {
    // call yo internally
    const env = yeoman.createEnv(
      [],
      {
        cwd,
        newErrorHandler: true,
      },
      adapter,
    );
    const GeneratorSetupWorkspace = require('../setup-workspace');
    const GeneratorCloneRepo = require('../clone-repo');
    const GeneratorWorkspace = require('../workspace');
    const GeneratorUpdate = require('../update');
    env.registerStub(GeneratorSetupWorkspace, 'phovea:setup-workspace', path.resolve(__dirname, '../setup-workspace'));
    env.registerStub(GeneratorCloneRepo, 'phovea:clone-repo', path.resolve(__dirname, '../clone-repo/index.js'));
    env.registerStub(GeneratorWorkspace, 'phovea:workspace', path.resolve(__dirname, '../workspace/index.js'));
    env.registerStub(GeneratorUpdate, 'phovea:update', path.resolve(__dirname, '../update'));
    const _args = Array.isArray(args) ? args.join(' ') : args || '';
    return new Promise((resolve, reject) => {
      try {
        env.run(`phovea:${generator} ${_args}`, options || {}, (e) => {
          if (isError(e)) {
            reject(e);
          } else {
            // wait a second after running yo to commit the files correctly
            setTimeout(() => resolve(), 500);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Creates object with custom formatting functions that can be called inside a template file when copying a template.
   *
   * @param {{}} config Config file
   */
  static stringifyAble(config) {
    return {
      stringifyPython: (obj, space) => {
        let base = GeneratorUtils.stringifyInline(obj, space);
        // python different true false
        base = base.replace(/: true/g, ': True').replace(/: false/g, ': False');
        return base;
      },
      stringify: GeneratorUtils.stringifyInline,
      isWeb: (p) => {
        const { plugin } = require('./known');
        return plugin.isTypeWeb(p);
      },
      ...config,
    };
  }

  /**
   * Stringifies object and applies custom formatting.
   *
   * @param {{}} obj Object to stringify.
   * @param {string} space String containing the spaces to use to fromat stringified object.
   */
  static stringifyInline(obj, space) {
    let base = JSON.stringify(obj, null, ' ');
    // common style
    base = base.replace(/"/g, "'");
    // prefix with space
    base = base
      .split('\n')
      .map((l) => space + l)
      .join('\n');
    return base.substring(space.length); // skip the first space
  }

  /**
   * Parses a string of the format `key=value` into an object.
   * Nested fields are defined using dot notation.
   *
   * @param {string} text String to format
   * @example
   *
   * const text = `
   *     count=3
   *     type.lib=false
   *    `
   *
   * toJSONFromText(text)
   * // => {count: 3, type: {lib: false }}
   */
  static toJSONFromText(text) {
    const r = {};
    if (typeof text !== 'string') return r;

    text.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) {
        // ignore empty lines (e.g. new line added by editor)
        return;
      }

      const splitPoint = trimmedLine.indexOf('=');
      const key = trimmedLine.slice(0, splitPoint);
      let value = trimmedLine.slice(splitPoint + 1);
      value = value.trim();
      if (!Number.isNaN(parseFloat(value))) {
        value = parseFloat(value);
      }

      if (value === 'true' || value === 'false') {
        value = JSON.parse(value);
      }

      let obj = r;
      const keys = key.trim().split('.');
      keys.slice(0, keys.length - 1).forEach((k) => {
        if (!(k in obj)) {
          obj[k] = {};
        }
        obj = obj[k];
      });
      obj[keys[keys.length - 1]] = value;
    });
    return r;
  }
};
