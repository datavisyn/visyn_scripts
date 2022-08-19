/* eslint-disable global-require */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
const path = require('path');
const glob = require('glob').sync;
const chalk = require('chalk');
const { extend } = require('lodash');
const _ = require('lodash');
const fs = require('fs');
const yaml = require('yamljs');
const NpmUtils = require('../utils/NpmUtils');
const PipUtils = require('../utils/PipUtils');
const BasePhoveaGenerator = require('../BasePhoveaGenerator');
const WorkspaceUtils = require('../utils/WorkspaceUtils');

const known = () => require('../utils/known');

function mergeWith(target, source) {
  const mergeArrayUnion = (a, b) => (Array.isArray(a) ? _.union(a, b) : undefined);
  _.mergeWith(target, source, mergeArrayUnion);
  return target;
}

function isHelperContainer(name) {
  return name.includes('_');
}

/**
 * rewrite the compose by inlining _host to all services not containing a dash, such that both api and celery have the same entry
 * @param compose
 */
function rewriteDockerCompose(compose) {
  const services = compose.services;
  if (!services) {
    return compose;
  }
  const host = services._host;
  delete services._host;
  Object.keys(services).forEach((k) => {
    if (!isHelperContainer(k)) {
      mergeWith(services[k], host);
    }
  });
  return compose;
}

class Generator extends BasePhoveaGenerator {
  constructor(args, options) {
    super(args, options);

    let defaultConfig = {
      name: 'phovea_workspace',
      description: 'helper package',
      version: '0.0.1',
      skipNextStepsLog: false,
      defaultApp: 'phovea',
      addWorkspaceRepos: true,
    };

    // use existing workspace package.json as default
    const pkgPath = this.destinationPath('package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = this.fs.readJSON(pkgPath);
      defaultConfig = Object.assign(defaultConfig, { name: pkg.name, description: pkg.description, version: pkg.version });
    }

    // readme content
    this.option('noAdditionals');
    this.option('defaultApp', {
      type: String,
      default: defaultConfig.defaultApp,
      description: 'Default application for the workspace',
    });

    this.option('wsName', {
      type: String,
      default: defaultConfig.name,
      description: 'Name for workspace package.json',
    });

    this.option('wsDescription', {
      type: String,
      default: defaultConfig.description,
      description: 'Description for workspace package.json',
    });

    this.option('wsVersion', {
      type: String,
      default: defaultConfig.version,
      description: 'Version for workspace package.json',
    });

    this.option('skipNextStepsLog', {
      type: Boolean,
      default: defaultConfig.skipNextStepsLog,
      description: 'Skip the log message with the next steps at the end',
    });
    this.option('addWorkspaceRepos', {
      type: Boolean,
      default: defaultConfig.addWorkspaceRepos,
      description:
        'States whether workspace repos should be part of the dependencies. Set to `true` for local development setup. Otherwise `false` for CI build process.',
    });
  }

  initializing() {
    this.props = this.fs.readJSON(this.destinationPath('.yo-rc-workspace.json'), { defaultApp: null });
    this.props.defaultApp = this.props.defaultApp || this.options.defaultApp;
  }

  prompting() {
    const apps = this._findApps();
    return this.prompt([
      {
        type: 'list',
        name: 'defaultApp',
        message: 'Default application to launch using `npm start`?',
        choices: apps,
        default: apps[0],
        when: apps.length > 1 && !this.props.defaultApp,
      },
    ]).then((props) => {
      if (props.defaultApp) {
        this.props.defaultApp = props.defaultApp;
      } else if (apps.length === 1 && !this.props.defaultApp) {
        this.props.defaultApp = apps[0];
      }
    });
  }

  _findApps() {
    return glob('*/.yo-rc.json', {
      cwd: this.destinationPath(),
    })
      .filter((p) => {
        const config = this.fs.readJSON(this.destinationPath(p));
        return config?.['generator-phovea']?.type?.includes('app');
      })
      .map(path.dirname);
  }

  _generateWebDependencies() {
    const files = glob('*/tsconfig.json', {
      // web plugin
      cwd: this.destinationPath(),
    });
    const plugins = files.map(path.dirname);
    const repoDependencies = Object.assign({}, ...plugins.map((plugin) => ({ [plugin]: `link:./${plugin}` })));

    const integrateMulti = (target, source) => {
      Object.keys(source || {}).forEach((key) => {
        const value = source[key];
        if (key in target) {
          target[key].push(value);
        } else {
          target[key] = [value];
        }
      });
    };

    // generate dependencies
    const dependencies = {};
    const devDependencies = {};
    const overrides = {};
    const scripts = {};
    plugins.forEach((p) => {
      const pkg = this.fs.readJSON(this.destinationPath(`${p}/package.json`));
      integrateMulti(dependencies, pkg.dependencies);
      integrateMulti(devDependencies, pkg.devDependencies);
      integrateMulti(overrides, pkg.overrides);

      // no pre post test tasks
      Object.keys(pkg.scripts)
        .filter((s) => !/^(pre|post).*/g.test(s))
        .forEach((s) => {
          // generate scoped tasks
          scripts[`${s}:${p}`] = `cd ${p} && npm run ${s}`;
        });

      scripts[`docker-run:${p}`] = `docker compose run -w /phovea/${p} api`;
      scripts[`docker-exec:${p}`] = `docker compose exec -w /phovea/${p} api`;
    });
    scripts['docker-run'] = 'docker compose run api';
    scripts['docker-exec'] = 'docker compose exec api';

    // add additional to install plugins
    if (this.props.defaultApp) {
      // enforce that the dependencies of the default app are the last one to have a setup suitable for the default app thus more predictable
      const pkg = this.fs.readJSON(this.destinationPath(`${this.props.defaultApp}/package.json`));
      if (pkg) {
        integrateMulti(dependencies, pkg.dependencies);
        integrateMulti(devDependencies, pkg.devDependencies);
        integrateMulti(overrides, pkg.overrides);
      }
    }
    // remove all plugins that are locally installed
    plugins.forEach((p) => {
      const k = known().plugin.byName(p);
      if (k && k.dependencies) {
        Object.keys(k.dependencies).forEach((pi) => {
          delete dependencies[pi];
        });
      }
      delete dependencies[p];
    });

    Object.keys(dependencies).forEach((key) => {
      dependencies[key] = NpmUtils.mergeVersions(key, dependencies[key]);
    });
    Object.keys(devDependencies).forEach((key) => {
      devDependencies[key] = NpmUtils.mergeVersions(key, devDependencies[key]);
    });
    Object.keys(overrides).forEach((key) => {
      overrides[key] = Array.from(new Set(overrides[key]));
      if (overrides[key].length !== 1) {
        console.error(`"overrides" of ${key} in package.json could not be merged, using first of: ${overrides[key]}`);
      }
      overrides[key] = overrides[key][0];
    });

    // dependencies from package.tmpl.json
    const extraDependencies = this.fs.readJSON(this.templatePath('package.tmpl.json')).dependencies;
    // devDependencies from package.tmpl.json
    const extraDevDependencies = this.fs.readJSON(this.templatePath('package.tmpl.json')).devDependencies;
    // overrides from package.tmpl.json
    const extraOverrides = this.fs.readJSON(this.templatePath('package.tmpl.json')).overrides || {};
    const extraResolutions = this.fs.readJSON(this.templatePath('package.tmpl.json')).resolutions || {};
    // scripts from package.tmpl.json
    const extraScripts = this.fs.readJSON(this.templatePath('package.tmpl.json')).scripts;

    return {
      plugins,
      dependencies: Object.assign(Object.assign(dependencies, extraDependencies), this.options.addWorkspaceRepos ? repoDependencies : {}),
      devDependencies: Object.assign(devDependencies, extraDevDependencies),
      overrides: Object.assign(overrides, extraOverrides),
      resolutions: Object.assign(overrides, extraResolutions),
      scripts: Object.assign(scripts, extraScripts),
    };
  }

  _generateServerDependencies() {
    const files = glob('*/requirements.txt', {
      // server plugin
      cwd: this.destinationPath(),
    });
    const plugins = files.map(path.dirname);

    const requirements = {};
    const devRequirements = {};
    const dockerCompose = {};
    const dockerComposeDebug = {};
    const scripts = {};

    const integrateMulti = (target, source) => {
      Object.keys(source || {}).forEach((key) => {
        const value = source[key];
        if (key in target) {
          target[key].push(value);
        } else {
          target[key] = [value];
        }
      });
    };

    plugins.forEach((p) => {
      integrateMulti(requirements, PipUtils.parseRequirements(this.fs.read(this.destinationPath(`${p}/requirements.txt`), { defaults: '' })));
      integrateMulti(devRequirements, PipUtils.parseRequirements(this.fs.read(this.destinationPath(`${p}/requirements_dev.txt`), { defaults: '' })));

      // merge docker-compose
      const dockerFile = (fileName) => {
        if (!fs.existsSync(this.destinationPath(fileName))) {
          return {};
        }
        const text = this.fs.read(this.destinationPath(fileName));
        const localCompose = yaml.parse(text);

        // inject to use right docker file
        Object.keys(localCompose.services || {}).forEach((key) => {
          const service = localCompose.services[key];
          if (service.build && service.build.context === '.') {
            service.build.dockerfile = `${p}/${service.build.dockerfile}`;
          }
          if (isHelperContainer(key)) {
            // change local volumes
            service.volumes = (service.volumes || []).map((volume) => {
              if (volume.startsWith('.')) {
                return `./${p}${volume.slice(1)}`;
              }
              return volume;
            });
          }
        });

        return localCompose;
      };
      mergeWith(dockerCompose, dockerFile(`${p}/deploy/docker-compose.partial.yml`));
      mergeWith(dockerComposeDebug, dockerFile(`${p}/deploy/docker-compose-debug.partial.yml`));
    });

    // remove all plugins that are locally installed
    plugins.forEach((p) => {
      const k = known().plugin.byName(p);

      delete requirements[p];
      delete requirements[p.replace('_', '-')];

      if (k) {
        if (k.requirements) {
          Object.keys(k.requirements).forEach((pi) => {
            delete requirements[pi];
          });
        }
        if (k.develop && k.develop.requirements) {
          Object.keys(k.develop.requirements).forEach((pi) => {
            delete requirements[pi];
          });
        }
      }

      // more intelligent guessing
      Object.keys(requirements).forEach((k) => {
        const full = k + requirements[k];
        if (full.includes(`/${p}.git@`) || full.startsWith(`${p}==`) || full.replace(/-/gm, '_').startsWith(`${p}==`)) {
          delete requirements[k];
        }
      });
    });

    Object.keys(requirements).forEach((key) => {
      requirements[key] = PipUtils.mergePipVersions(key, requirements[key]);
    });
    Object.keys(devRequirements).forEach((key) => {
      devRequirements[key] = PipUtils.mergePipVersions(key, devRequirements[key]);
    });

    return {
      plugins,
      requirements: Object.keys(requirements).map((k) => `${k}${requirements[k]}`),
      devRequirements: Object.keys(devRequirements).map((k) => `${k}${devRequirements[k]}`),
      scripts,
      dockerCompose: rewriteDockerCompose(dockerCompose),
      dockerComposeDebug: rewriteDockerCompose(dockerComposeDebug),
    };
  }

  _patchDockerImages(dockerComposePatch, dockerCompose) {
    const services = dockerCompose.services;
    if (!services) {
      return;
    }
    const patchedServices = dockerComposePatch.services || {};
    Object.keys(services).forEach((name) => {
      const patch = patchedServices[name];
      if (!patch) {
        return;
      }
      const service = services[name];
      mergeWith(service, patch);
      if (!service.build || !patch.image) {
        return;
      }
      delete service.image; // delete merged image if used
      const dockerFile = this.destinationPath(service.build.dockerfile);
      let content = this.fs.read(dockerFile).toString();
      // create a copy of the Dockerfile to avoid git changes
      const r = /^\s*FROM (.+)\s*$/gim;
      const fromImage = r.exec(content)[1];
      content = content.replace(r, `FROM ${patch.image}`);
      const targetDockerFile = this.destinationPath(`Dockerfile_${name}`);

      this.log(`patching ${dockerFile} change from ${fromImage} -> ${patch.image} resulting in ${targetDockerFile}`);
      this.fs.write(targetDockerFile, content);
      service.build.dockerfile = `Dockerfile_${name}`; // since we are in the workspace
    });
  }

  /**
   * Collects all variables.scss and main.scss files of the frontend plugins of the workspace
   * and imports them in the correct order in the workspace.scss file.
   * @param {string[]} frontendPlugins Frontend plugins
   */
  _checkWorkspaceScss(frontendPlugins) {
    if (fs.existsSync(this.destinationPath('workspace.scss'))) {
      const content = fs.readFileSync(this.destinationPath('workspace.scss'), 'utf-8');
      frontendPlugins.forEach((repo) => {
        if (fs.existsSync(this.destinationPath(`${repo}/dist/scss/main.scss`))) {
          if (!content.includes(`${repo}/dist/scss/main`)) {
            this.log(chalk.yellow(`main.scss of repository '${repo}' in workspace.scss not found`));
          }
        }
      });
    } else {
      this._generateWorkspaceScss(frontendPlugins);
    }
  }

  /**
   * Collects all variables.scss and main.scss files of the frontend plugins of the workspace
   * and imports them in the correct order in the workspace.scss file.
   * @param {string[]} frontendPlugins Frontend plugins of the given workspace
   */
  _generateWorkspaceScss(frontendPlugins) {
    const defaultApp = this.props.defaultApp;
    const frontendRepos = frontendPlugins.filter((r) => r !== defaultApp); // remove app from frontendRepos

    const sorted = frontendRepos.sort((a, b) => WorkspaceUtils.compareRepos(a, b));
    const reversed = [...sorted].reverse();

    const toVariableImport = (repo) => {
      if (fs.existsSync(this.destinationPath(`${repo}/dist/scss/abstracts/_variables.scss`))) {
        return `@import "~${repo}/dist/scss/abstracts/variables";`;
      }
      return '';
    };

    const toMainImport = (repo) => {
      if (fs.existsSync(this.destinationPath(`${repo}/dist/scss/main.scss`))) {
        return `@import "~${repo}/dist/scss/main"; `;
      }
      return '';
    };
    const DEBUG_VARIABLES = '@debug(\'import scss variables\');';
    const DEBUG_MAIN = '\n@debug(\'import main scss\'); ';
    const DEFAULT_APP_MAIN_BEGIN = '// generator-phovea:default-app:main:begin';
    const DEFAULT_APP_MAIN_END = '// generator-phovea:default-app:main:end';
    const DEFAULT_APP_VARIABLES_BEGIN = '// generator-phovea:default-app:variables:begin';
    const DEFAULT_APP_VARIABLE_END = '// generator-phovea:default-app:variables:end';
    const PLUGIN_MAIN_BEGIN = '// generator-phovea:plugin:main:begin';
    const PLUGIN_MAIN_END = '// generator-phovea:plugin:main:end';
    const PLUGIN_VARIABLES_BEGIN = '// generator-phovea:plugin:variables:begin';
    const PLUGIN_VARIABLE_END = '// generator-phovea:plugin:variables:end';

    const defaultAppImport = (repo, type = 'variables') => (type === 'variables' ? toVariableImport(repo) : toMainImport(repo));

    const imports = [
      DEBUG_VARIABLES,
      DEFAULT_APP_VARIABLES_BEGIN,
      defaultAppImport(defaultApp),
      DEFAULT_APP_VARIABLE_END,
      PLUGIN_VARIABLES_BEGIN,
      ...sorted.map((r) => toVariableImport(r)).filter((r) => Boolean(r)),
      PLUGIN_VARIABLE_END,
      DEBUG_MAIN,
      PLUGIN_MAIN_BEGIN,
      ...reversed.map((r) => toMainImport(r)).filter((r) => Boolean(r)),
      PLUGIN_MAIN_END,
      DEFAULT_APP_MAIN_BEGIN,
      defaultAppImport(defaultApp, 'main'),
      DEFAULT_APP_MAIN_END,
    ]
      .filter((r) => Boolean(r))
      .join('\n');

    this.log('Generated workspaces.scss: \n', imports);
    this.fs.write(this.destinationPath('workspace.scss'), imports);
  }

  writing() {
    const {
      plugins, dependencies, devDependencies, overrides, resolutions, scripts,
    } = this._generateWebDependencies();
    const sdeps = this._generateServerDependencies();
    const dockerWebHint = '  # Uncomment the following lines for testing the web production build\n'
      + '  #  web:\n'
      + '  #    build:\n'
      + '  #      context: ./deploy/web\n'
      + '  #      dockerfile: deploy/web/Dockerfile\n'
      + '  #    ports:\n'
      + "  #      - '8090:80'\n"
      + '  #    volumes:\n'
      + "  #      - './bundles:/usr/share/nginx/html'\n"
      + '  #    depends_on:\n'
      + '  #      - api\n';

    // save config
    this.fs.extendJSON(this.destinationPath('.yo-rc-workspace.json'), {
      defaultApp: this.props.defaultApp,
      devServerProxy: this.props.devServerProxy || {},
      registry: this.props.registry || [],
    });

    this._checkWorkspaceScss(plugins);

    // merge scripts together server wins
    extend(scripts, sdeps.scripts);
    {
      this.fs.write(this.destinationPath('docker-compose.yml'), yaml.stringify(sdeps.dockerCompose, 100, 2));
      this.fs.write(this.destinationPath('docker-compose-debug.yml'), yaml.stringify(sdeps.dockerComposeDebug, 100, 2) + dockerWebHint);
    }

    const config = {};
    config.workspace = path.basename(this.destinationPath());
    config.modules = _.union(plugins, sdeps.plugins);
    config.webmodules = plugins.filter((d) => fs.existsSync(this.destinationPath(`${d}/src/phovea_registry.ts`)));
    config.servermodules = sdeps.plugins;
    config.dockerCompose = path.resolve(this.destinationPath('docker-compose.yml'));
    config.wsName = this.options.wsName;
    config.wsDescription = this.options.wsDescription;
    config.wsVersion = this.options.wsVersion;

    this._writeTemplates(config, false);
    // replace the added entries
    this._patchPackageJSON(config, [], {
      devDependencies, overrides, resolutions, dependencies, scripts,
    }, true);

    if (!fs.existsSync(this.destinationPath('config.json'))) {
      this.fs.copy(this.templatePath('config.tmpl.json'), this.destinationPath('config.json'));
    }

    this.fs.write(this.destinationPath('requirements.txt'), sdeps.requirements.sort().join('\n'));
    this.fs.write(this.destinationPath('requirements_dev.txt'), sdeps.devRequirements.sort().join('\n'));
    this.fs.write(
      this.destinationPath('requirements_workspace.txt'),
      sdeps.plugins
        .map((p) => `-e /phovea/${p}`)
        .sort()
        .join('\n'),
    );
  }

  end() {
    if (this.options.skipNextStepsLog) {
      return;
    }

    this.log('\n\nUseful commands: ');

    this.log(chalk.red(' docker compose up'), '                    ... starts the system');
    this.log(chalk.red(' docker compose restart'), '               ... restart');
    this.log(chalk.red(' docker compose stop'), '                  ... stop');
    this.log(chalk.red(' docker compose build api'), '             ... rebuild api (in case of new dependencies)');
    this.log(chalk.red(' docker compose logs -f --tail=50 api'), ' ... show the last 50 server log messages (-f to auto update)');

    this.log('\n\nNext steps: ');

    this.log(chalk.red(' yarn install'));
    this.log(chalk.red(' docker compose up'));
  }
}

module.exports = Generator;
