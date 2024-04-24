/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const path = require('path');
const fs = require('fs');
const { defineConfig } = require('@rspack/cli');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const dotenv = require('dotenv');
const { DotenvPlugin } = require('rspack-plugin-dotenv');
const dotenvExpand = require('dotenv-expand');
const {
  CopyRspackPlugin, DefinePlugin, SwcJsMinimizerRspackPlugin, SwcCssMinimizerRspackPlugin,
} = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

// Load the current .env and expand it
const parsedEnv = dotenvExpand.expand(dotenv.config());

module.exports = (webpackEnv, argv) => {
  const env = {
    ...(parsedEnv.parsed || {}),
    ...(webpackEnv || {}),
  };
  const { mode } = argv;
  const isEnvDevelopment = mode === 'development';
  const isEnvProduction = mode === 'production';
  const isDevServer = webpackEnv.RSPACK_SERVE;
  if (!isEnvDevelopment && !isEnvProduction) {
    throw Error(`Invalid mode passed: ${mode}`);
  }

  const isDevServerOnly = env.dev_server_only?.toLowerCase() === 'true';
  const devtool = (env.devtool?.toLowerCase() === 'false' ? false : env.devtool) || (isEnvDevelopment ? 'eval-cheap-module-source-map' : 'source-map');
  const isReactRefresh = isDevServer && isEnvDevelopment;

  const now = new Date();
  const workspacePath = fs.realpathSync(process.cwd());
  const appPkg = require(path.join(workspacePath, 'package.json'));
  const workspaceBuildInfoFile = path.join(workspacePath, 'package-lock.json');
  const workspaceMetaDataFile = path.join(workspacePath, 'metaData.json');
  // Always look for the phovea_registry.ts in the src folder for standalone repos.
  const workspaceRegistryFile = path.join(workspacePath, 'src/phovea_registry.ts');

  if (!appPkg.visyn) {
    throw Error(`The package.json of ${appPkg.name} does not contain a 'visyn' entry.`);
  }

  /**
   * Configuration of visyn repos. Includes entrypoints, registry configuration, files to copy, ...
   *
   * {
   *   entries: {
   *     [chunkName: string]: {
   *       js: string;
   *       html?: string;
   *       template?: string;
   *       excludeChunks?: string[];
   *       scss?: string;
   *     };
   *   };
   *   registry: any;
   *   copyFiles?: string[];
   * }
   */

  try {
    // If a visynWebpackOverride.js file exists in the default app, it will be used to override the visyn configuration.
    const visynWebpackOverride = require(path.join(workspacePath, 'visynWebpackOverride.js'))({ env }) || {};
    console.log('Using visynWebpackOverride.js file to override visyn configuration.');
    Object.assign(appPkg.visyn, visynWebpackOverride);
  } catch (e) {
    // ignore if file does not exist
  }

  let {
    // eslint-disable-next-line prefer-const
    devServerProxy, entries, copyFiles, historyApiFallback,
  } = appPkg.visyn;

  if (isDevServerOnly) {
    // If we do yarn start dev_server_only=true, we only want to start the dev server and not build the app (i.e. for proxy support).
    entries = {};
  }

  const prefix = (n) => (n < 10 ? `0${n}` : n.toString());
  const buildId = `${now.getUTCFullYear()}${prefix(now.getUTCMonth() + 1)}${prefix(now.getUTCDate())}-${prefix(now.getUTCHours())}${prefix(now.getUTCMinutes())}${prefix(now.getUTCSeconds())}`;

  // Check if Tailwind config exists
  const useTailwind = fs.existsSync(path.join(workspacePath, 'tailwind.config.js'));

  return defineConfig({
    mode,
    // Logging noise constrained to errors and warnings
    stats: 'errors-warnings', //  { logging: 'verbose', timings: true, assets: true },
    devtool,
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: Object.fromEntries(
      Object.entries(entries).map(([key, entry]) => [
        key,
        [workspaceRegistryFile, path.join(workspacePath, entry.js), entry.scss ? path.join(workspacePath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
      ]),
    ),
    devServer: isEnvDevelopment
      ? {
        static: path.resolve(workspacePath, 'bundles'),
        compress: true,
        // Explicitly set hot to true and liveReload to false to ensure that hot is preferred over liveReload
        hot: true,
        liveReload: false,
        // Explicitly set the host to ipv4 local address to ensure that the dev server is reachable from the host machine: https://github.com/cypress-io/cypress/issues/25397
        host: '127.0.0.1',
        open: true,
        // Needs to be enabled to make SPAs work: https://stackoverflow.com/questions/31945763/how-to-tell-webpack-dev-server-to-serve-index-html-for-any-route
        historyApiFallback: historyApiFallback == null ? true : historyApiFallback,
        proxy: {
          // Append on top to allow overriding /api/v1/ for example
          ...(devServerProxy || {}),
          ...{
            '/api/*': {
              target: 'http://localhost:9000',
              secure: false,
              ws: true,
              // Explicitly forward close events for properly closing SSE (server-side events). See https://github.com/webpack/webpack-dev-server/issues/2769#issuecomment-1517290190
              onProxyReq: (proxyReq, req, res) => {
                res.on('close', () => proxyReq.destroy());
              },
            },
            '/login': {
              target: 'http://localhost:9000',
              secure: false,
            },
            '/logout': {
              target: 'http://localhost:9000',
              secure: false,
            },
            '/loggedinas': {
              target: 'http://localhost:9000',
              secure: false,
            },
            // Append on bottom to allow override of exact key matches like /api/*
            ...(devServerProxy || {}),
          },
        },
        client: {
          // Do not show the full-page error overlay
          overlay: false,
        },
      }
      : undefined,
    output: {
      // The build folder.
      path: path.join(workspacePath, 'bundles'),
      // Add /* filename */ comments to generated require()s in the output.
      // TODO: rspack: pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      filename: '[name].[contenthash:8].js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: '[name].[contenthash:8].chunk.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: '/',
      clean: !isDevServerOnly,
    },
    /*
    snapshot: {
      managedPaths: customResolveAliasRegex ? [
        customResolveAliasRegex,
      ] : undefined,
    },
    */
    resolve: {
      extensions: ['.json', '.wasm', '.tsx', '.ts', '.js', '.jsx'],
      // By default, always search for modules in the relative node_modules. However,
      // if the package can not be found, fall back to the workspace node_modules. This is
      // useful when using the resolveAliases to resolve a package to somewhere else.
      modules: ['node_modules', path.join(workspacePath, 'node_modules')],
      fallback: {
        util: require.resolve('util/'),
        // Disable polyfills, if required add them via require.resolve("crypto-browserify")
        crypto: false,
        path: false,
        fs: false,
      },
    },
    optimization: {
      minimizer: [
        // Disable compress as it has some bugs, i.e. when using arquero#from it fails if no names are passed.
        // See https://github.com/web-infra-dev/rspack/issues/4980 for a discussion.
        new SwcJsMinimizerRspackPlugin({
          compress: false,
        }),
        new SwcCssMinimizerRspackPlugin(),
      ],
    },
    module: {
      rules: [
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // Add ability to inline assets (like .md files) directly into the bundle.
            // This is done by adding ?raw to the import, like import Content from './content.md?raw';
            // See https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax for more details.
            {
              resourceQuery: /raw/,
              type: 'asset/source',
            },

            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: 'asset',
            },
            {
              test: /\.svg(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              // css-loader is messing up SVGs: https://github.com/webpack/webpack/issues/13835
              // Pin css-loader and always load them as file-resource.
              type: 'asset/resource',
            },
            {
              test: /\.html$/i,
              loader: 'html-loader',
              options: {
                // Disable exporting html-files as ES-modules as otherwise [object Module] shows up instead of the inline-content: https://localcoder.org/when-using-file-loader-and-html-loader-in-webpack-the-src-attr-of-image-is-obj
                esModule: false,
              },
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: [/node_modules/],
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: true,
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                    decorators: true,
                    // TODO: Check what other settings should be supported: https://swc.rs/docs/configuration/swcrc#compilation
                  },
                  externalHelpers: true,
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: isEnvDevelopment,
                      refresh: isReactRefresh,
                    },
                  },
                },
              },
              type: 'javascript/auto',
            },
            // Process application TS with swc-loader even if they are coming from node_modules, i.e. from non-built dependencies.
            {
              test: /\.(ts|tsx)$/,
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: true,
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                    decorators: true,
                    // TODO: Check what other settings should be supported: https://swc.rs/docs/configuration/swcrc#compilation
                  },
                  externalHelpers: true,
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: isEnvDevelopment,
                      refresh: isReactRefresh,
                    },
                  },
                },
              },
              type: 'javascript/auto',
            },
            {
              test: /\.css$/,
              use: [
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      plugins: !useTailwind
                        ? [
                          'postcss-flexbugs-fixes',
                          [
                            'postcss-preset-env',
                            {
                              autoprefixer: {
                                flexbox: 'no-2009',
                              },
                              stage: 3,
                            },
                          ],
                          // Adds PostCSS Normalize as the reset css with default options,
                          // so that it honors browserslist config in package.json
                          // which in turn let's users customize the target behavior as per their needs.
                          'postcss-normalize',
                        ]
                        : [
                          'tailwindcss/nesting',
                          'tailwindcss',
                          'postcss-flexbugs-fixes',
                          [
                            'postcss-preset-env',
                            {
                              autoprefixer: {
                                flexbox: 'no-2009',
                              },
                              stage: 3,
                            },
                          ],
                        ],
                    },
                  },
                },
              ],
              type: 'css/auto',
            },
            {
              test: /\.(sass|scss)$/,
              use: [
                {
                  // Prepend this loader to ensure that relative path imports in scss work: https://github.com/webpack-contrib/sass-loader?tab=readme-ov-file#problems-with-url
                  loader: 'resolve-url-loader',
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: true, // <-- !!IMPORTANT!!
                    sassOptions: {
                      outputStyle: 'expanded', // @see https://github.com/FortAwesome/Font-Awesome/issues/17644#issuecomment-1703318326
                    },
                  },
                },
              ],
              type: 'css/auto',
            },

            // TODO: ifdef-loader
            // TODO: expose-loader

            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html`, `ejs` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.ejs$/, /\.json$/],
              type: 'asset/resource',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ].filter(Boolean),
        },
      ].filter(Boolean),
    },
    plugins: [
      process.env.RSDOCTOR && new RsdoctorRspackPlugin(),
      isReactRefresh && new ReactRefreshPlugin(),
      new DotenvPlugin({
        path: path.join(workspacePath, '.env'), // load this now instead of the ones in '.env'
        safe: false, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
        allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
        systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
        silent: true, // hide any errors
        defaults: false, // load '.env.defaults' as the default values if empty.
      }),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.__VERSION__': JSON.stringify(appPkg.version),
        'process.env.__LICENSE__': JSON.stringify(appPkg.license),
        'process.env.__BUILD_ID__': JSON.stringify(buildId),
        'process.env.__APP_CONTEXT__': JSON.stringify('/'),
        'process.env.__DEBUG__': JSON.stringify(isEnvDevelopment),
      }),
      new CopyRspackPlugin({
        patterns: [
          ...(copyFiles?.map((file) => ({
            from: path.join(workspacePath, file),
            to: path.join(workspacePath, 'bundles', path.basename(file)),
          })) || []),
          ...[
            fs.existsSync(workspaceMetaDataFile) && {
              from: workspaceMetaDataFile,
              to: path.join(workspacePath, 'bundles', 'phoveaMetaData.json'),
              // @ts-ignore TODO: check why https://webpack.js.org/plugins/copy-webpack-plugin/#transform is not in the typing.
              transform: () => {
                function resolveScreenshot(appDirectory) {
                  const f = path.join(appDirectory, './media/screenshot.png');
                  if (!fs.existsSync(f)) {
                    return null;
                  }
                  const buffer = Buffer.from(fs.readFileSync(f)).toString('base64');
                  return `data:image/png;base64,${buffer}`;
                }

                return JSON.stringify(
                  {
                    name: appPkg.name,
                    displayName: appPkg.displayName || appPkg.name,
                    version: appPkg.version,
                    repository: appPkg.repository?.url,
                    homepage: appPkg.homepage,
                    description: appPkg.description,
                    screenshot: resolveScreenshot(workspacePath),
                    buildId,
                  },
                  null,
                  2,
                );
              },
            },
            // use package-lock json as buildInfo
            fs.existsSync(workspaceBuildInfoFile) && {
              from: workspaceBuildInfoFile,
              to: path.join(workspacePath, 'bundles', 'buildInfo.json'),
            },
          ].filter(Boolean),
        ],
      }),
      ...Object.entries(entries).map(
        // TODO: Do not use HtmlRspackPlugin, as it can't handle require calls in ejs templates.
        ([chunkName, entry]) => new HtmlWebpackPlugin({
          template: entry.template ? path.join(workspacePath, entry.template) : 'auto',
          filename: entry.html || `${chunkName}.html`,
          title: appPkg.name,
          chunks: [chunkName],
          // By default, exclude all other chunks
          excludedChunks: entry.excludeChunks || Object.keys(entries).filter((entryKey) => entryKey !== chunkName),
          meta: {
            description: appPkg.description || '',
          },
          minify: isEnvProduction,
        }),
      ),
      isEnvDevelopment
        && new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            diagnosticOptions: {
              semantic: true,
              syntactic: true,
            },
            // Build the repo and type-check
            build: true,
            mode: 'write-references',
            configFile: path.join(workspacePath, 'tsconfig.json'),
          },
        }),
    ].filter(Boolean),
  });
};
