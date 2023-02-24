/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
// eslint-disable-next-line no-unused-vars
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// eslint-disable-next-line no-unused-vars
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const { parseTsconfig } = require('get-tsconfig');

let jquery = null;
try {
  jquery = require.resolve('jquery');
} catch {
  // pass
}

// const { TimeAnalyticsPlugin } = require('time-analytics-webpack-plugin');

// Load the current .env and expand it
const parsedEnv = dotenvExpand.expand(dotenv.config());

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

module.exports = (webpackEnv, argv) => {
  const env = {
    ...(parsedEnv.parsed || {}),
    ...(webpackEnv || {}),
  };
  const { mode } = argv;
  const isEnvDevelopment = mode === 'development';
  const isEnvProduction = mode === 'production';
  if (!isEnvDevelopment && !isEnvProduction) {
    throw Error(`Invalid mode passed: ${mode}`);
  }
  /**
   * Single repo mode determines if the webpack config is being used in a standalone repository, not within a workspace.
   */
  const isSingleRepoMode = env.workspace_mode?.toLowerCase() === 'single';
  const isFastMode = env.fast?.toLowerCase() === 'true';
  const devServerOnly = env.dev_server_only?.toLowerCase() === 'true';

  if (isFastMode) {
    console.log('Fast mode enabled: disabled sourcemaps, type-checking, ...');
  }

  // Source maps are resource heavy and can cause out of memory issue for large source files.
  const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

  const now = new Date();
  const year = now.getFullYear();
  // workspace constants
  const workspacePath = fs.realpathSync(process.cwd()); // TODO: Add , '../') if you move this file in a subdirectory
  /* {
    workspaceAliases: { [key: string]: string };
    registry: any;
    frontendRepos: any;
    maxChunkSize?: number;
    // TODO: This is not required anymore, because we let webpack split chunks?
    vendors: any;
    devServerProxy: any;
  } */
  const workspaceYoRcFile = fs.existsSync(path.join(workspacePath, '.yo-rc-workspace.json')) ? require(path.join(workspacePath, '.yo-rc-workspace.json')) : {};
  const workspacePkg = require(path.join(workspacePath, 'package.json'));
  const workspaceBuildInfoFile = path.join(workspacePath, 'package-lock.json');
  const workspaceMetaDataFile = path.join(workspacePath, 'metaData.json');
  // Always look for the phovea_registry.ts in the src folder for standalone repos, or in the workspace root in workspaces.
  const workspaceRegistryFile = path.join(workspacePath, isSingleRepoMode ? 'src/' : '', 'phovea_registry.ts');
  const workspaceRegistry = workspaceYoRcFile.registry || [];
  const workspaceRepos = isSingleRepoMode ? ['./'] : workspaceYoRcFile.frontendRepos || [];
  const workspaceMaxChunkSize = workspaceYoRcFile.maxChunkSize || 5000000;
  const resolveAliases = Object.fromEntries(Object.entries(workspaceYoRcFile.resolveAliases || {}).map(([key, p]) => [key, path.join(workspacePath, p)]));
  // Use a regex with capturing group as explained in https://github.com/webpack/webpack/pull/14509#issuecomment-1237348087.
  const customResolveAliasRegex = Object.entries(resolveAliases).length > 0 ? new RegExp(`/^(.+?[\\/]node_modules[\\/](?!(${Object.keys(resolveAliases).join('|')}))(@.+?[\\/])?.+?)[\\/]/`) : null;
  Object.entries(resolveAliases).forEach(([key, p]) => console.log(`Using custom resolve alias: ${key} -> ${p}`));

  const workspaceRepoToName = Object.fromEntries(workspaceRepos.map((r) => [r, require(path.join(workspacePath, r, 'package.json')).name]));

  const defaultApp = isSingleRepoMode ? './' : workspaceYoRcFile.defaultApp;
  const defaultAppPath = path.join(workspacePath, defaultApp);
  const appPkg = require(path.join(defaultAppPath, 'package.json'));
  const libName = appPkg.name;
  const libDesc = appPkg.description;

  if (!appPkg.visyn) {
    throw Error(`The package.json of ${appPkg.name} does not contain a 'visyn' entry.`);
  }

  // Extract workspace proxy configuration from .yo-rc-workspace.json and package.json
  const workspaceProxy = { ...(appPkg.visyn.devServerProxy || {}), ...(workspaceYoRcFile.devServerProxy || {}) };

  /**
   * Configuration of visyn repos. Includes entrypoints, registry configuration, files to copy, ...
   *
   * {
   *   entries: {
   *     [chunkName: string]: {
   *       js: string;
   *       html: string;
   *       template: string;
   *       excludeChunks: string[];
   *       scss?: string;
   *     };
   *   };
   *   registry: any;
   *   copyFiles?: string[];
   * }
   */

  try {
    // If a visynWebpackOverride.js file exists in the default app, it will be used to override the visyn configuration.
    const visynWebpackOverride = require(path.join(defaultAppPath, 'visynWebpackOverride.js'))({ env }) || {};
    console.log('Using visynWebpackOverride.js file to override visyn configuration.');
    Object.assign(appPkg.visyn, visynWebpackOverride);
  } catch (e) {
    // ignore if file does not exist
  }

  let {
    // eslint-disable-next-line prefer-const
    entries, registry, copyFiles, historyApiFallback,
  } = appPkg.visyn;

  if (devServerOnly) {
    // If we do yarn start dev_server_only=true, we only want to start the dev server and not build the app (i.e. for proxy support).
    entries = {};
  }

  const tsconfigJson = parseTsconfig(path.join(workspacePath, 'tsconfig.json'));
  const isLegacyModuleResolution = tsconfigJson?.compilerOptions?.moduleResolution?.toLowerCase() === 'node';
  if (isLegacyModuleResolution) {
    console.warn('visyn user: you are still using moduleResolution: node. Try to upgrade to node16 as soon as possible!');
  }

  const copyAppFiles = copyFiles?.map((file) => ({
    from: path.join(defaultAppPath, file),
    to: path.join(workspacePath, 'bundles', path.basename(file)),
  })) || [];

  const prefix = (n) => (n < 10 ? `0${n}` : n.toString());
  const buildId = `${now.getUTCFullYear()}${prefix(now.getUTCMonth() + 1)}${prefix(now.getUTCDate())}-${prefix(now.getUTCHours())}${prefix(now.getUTCMinutes())}${prefix(now.getUTCSeconds())}`;

  const copyPluginPatterns = copyAppFiles.concat(
    [
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
              version: isEnvDevelopment ? appPkg.version : workspacePkg.version,
              repository: appPkg.repository?.url,
              homepage: appPkg.homepage,
              description: appPkg.description,
              screenshot: resolveScreenshot(defaultAppPath),
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
  );

  // Merge app and workspace properties
  const mergedRegistry = {
    ...(registry || {}),
    ...workspaceRegistry,
  };

  // Check if Tailwind config exists
  const useTailwind = fs.existsSync(path.join(workspacePath, 'tailwind.config.js'));
  const sourceMap = !isFastMode && (isEnvProduction ? shouldUseSourceMap : isEnvDevelopment);

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        // options: paths.publicUrlOrPath.startsWith('.')
        //  ? { publicPath: '../../' }
        //  : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            config: false,
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
          sourceMap,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap,
            // root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        },
      );
    }
    return loaders;
  };

  // Use TimeAnalyticsPlugin.wrap to anaylze the build time
  return {
    mode,
    // Webpack noise constrained to errors and warnings
    stats: 'errors-warnings',
    // eslint-disable-next-line no-nested-ternary
    devtool: isFastMode ? false : (isEnvDevelopment ? 'cheap-module-source-map' : 'source-map'),
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: Object.fromEntries(
      Object.entries(entries).map(([key, entry]) => [
        key,
        [workspaceRegistryFile, path.join(defaultAppPath, entry.js), entry.scss ? path.join(defaultAppPath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
      ]),
    ),
    devServer: isEnvDevelopment
      ? {
        static: path.resolve(workspacePath, 'bundles'),
        compress: true,
        host: 'localhost',
        open: true,
        // Needs to be enabled to make SPAs work: https://stackoverflow.com/questions/31945763/how-to-tell-webpack-dev-server-to-serve-index-html-for-any-route
        historyApiFallback: historyApiFallback == null ? true : historyApiFallback,
        proxy: {
          // Append on top to allow overriding /api/v1/ for example
          ...workspaceProxy,
          ...{
            '/api/*': {
              target: 'http://localhost:9000',
              secure: false,
              ws: true,
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
            ...workspaceProxy,
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
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      filename: '[name].[contenthash:8].js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: '[name].[contenthash:8].chunk.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: '/',
    },
    cache: {
      type: 'filesystem',
      // TODO: Check if we need that
      // version: createEnvironmentHash(env.raw),
      cacheDirectory: path.join(workspacePath, 'node_modules/.cache'),
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        // tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) =>
        //   fs.existsSync(f)
        // ),
      },
    },
    optimization: {
      nodeEnv: false, // will be set by DefinePlugin
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          // Use swcMinify instead of terser: https://webpack.js.org/plugins/terser-webpack-plugin/#swc
          minify: TerserPlugin.swcMinify,
          // `terserOptions` options will be passed to `swc` (`@swc/core`)
          // Link to options - https://swc.rs/docs/config-js-minify
          terserOptions: {},
        }),
        // This is only used in production mode
        // TODO: Somehow this breaks with lineup: /media/LineUpJS.d518227895a66b92cfd7.css:1:1: Unknown word [media/LineUpJS.d518227895a66b92cfd7.css:1,1]
        // new CssMinimizerPlugin(),
      ],
    },
    snapshot: {
      managedPaths: customResolveAliasRegex ? [
        customResolveAliasRegex,
      ] : undefined,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      // This is required to enable TS moduleResolution: node16, as there we have to add .js extensions which are actually .ts files.
      extensionAlias: isLegacyModuleResolution ? undefined : {
        '.js': ['.tsx', '.ts', '.js'],
        '.cjs': ['.cts', '.cjs'],
        '.mjs': ['.mts', '.mjs'],
      },
      // By default, always search for modules in the relative node_modules. However,
      // if the package can not be found, fall back to the workspace node_modules. This is
      // useful when using the resolveAliases to resolve a package to somewhere else.
      modules: ['node_modules', path.join(workspacePath, 'node_modules')],
      alias: Object.assign(
        {
          // Alias to jsx-runtime required as only React@18 has this export, otherwise it fails with "The request 'react/jsx-runtime' failed to resolve only because it was resolved as fully specified".
          // See https://github.com/facebook/react/issues/20235 for details.
          'react/jsx-runtime': 'react/jsx-runtime.js',
          'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
          ...resolveAliases,
        },
        // Add aliases for all the workspace repos
        ...(!isSingleRepoMode
          ? workspaceRepos.map((repo) => ({
            // Rewrite all '<repo>/dist' imports to '<repo>/src'
            [`${workspaceRepoToName[repo]}/dist`]: path.join(workspacePath, repo, 'src'),
            [`${workspaceRepoToName[repo]}/src`]: path.join(workspacePath, repo, 'src'),
            [`${workspaceRepoToName[repo]}`]: path.join(workspacePath, repo, 'src'),
          }))
          : [
            {
              // In single repo mode, also rewrite all '<repo>/dist' imports to '<repo>/src'
              [`${libName}/dist`]: path.join(workspacePath, 'src'),
              [`${libName}/src`]: path.join(workspacePath, 'src'),
              [`${libName}`]: path.join(workspacePath, 'src'),
            },
          ]),
      ),
      fallback: {
        util: require.resolve('util/'),
        // Disable polyfills, if required add them via require.resolve("crypto-browserify")
        crypto: false,
        path: false,
        fs: false,
      },
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        !isFastMode && shouldUseSourceMap && {
          enforce: 'pre',
          exclude: [/@babel(?:\/|\\{1,2})runtime/, customResolveAliasRegex].filter(Boolean),
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          loader: require.resolve('source-map-loader'),
        },
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
              parser: {
                dataUrlCondition: {
                  maxSize: workspaceMaxChunkSize,
                },
              },
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
            // Process application JS with swc-loader as it is much faster than babel.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: [/node_modules/, customResolveAliasRegex].filter(Boolean),
              loader: 'swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    decorators: true,
                    // TODO: Check what other settings should be supported: https://swc.rs/docs/configuration/swcrc#compilation
                  },
                },
              },
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap,
                modules: {
                  mode: 'icss',
                },
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap,
                modules: {
                  mode: 'local',
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap,
                  modules: {
                    mode: 'icss',
                  },
                },
                'sass-loader',
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap,
                  modules: {
                    mode: 'local',
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'sass-loader',
              ),
            },
            // TODO: This is legacy stuff, should it be included as well?
            {
              test: /(.*)\/phovea(_registry)?\.(js|ts)$/,
              use: [
                {
                  loader: 'ifdef-loader',
                  options: {
                    include: mergedRegistry
                      ? (extension, id) => {
                        const exclude = mergedRegistry.exclude || [];
                        const include = mergedRegistry.include || [];
                        if (!exclude && !include) {
                          return true;
                        }
                        const test = (f) => (Array.isArray(f) ? extension.match(f[0]) && (id || '').match(f[1]) : extension.match(f));
                        return include.every(test) && !exclude.some(test);
                      }
                      : () => true,
                    ...{ flags: (mergedRegistry || {}).flags || {} },
                  },
                },
              ],
            },
            // TODO: Is this legacy stuff, should it be included as well?
            jquery ? {
              test: jquery,
              loader: 'expose-loader',
              options: {
                exposes: ['window.jQuery', '$'],
              },
            } : null,
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
      !devServerOnly && new CleanWebpackPlugin(),
      isEnvDevelopment
        && new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      ...Object.entries(entries).map(
        ([chunkName, entry]) => new HtmlWebpackPlugin({
          inject: true,
          template: path.join(defaultAppPath, entry.template),
          filename: entry.html,
          title: libName,
          // By default, exclude all other chunks
          excludeChunks: entry.excludeChunks || Object.keys(entries).filter((entryKey) => entryKey !== chunkName),
          meta: {
            description: libDesc,
          },
          ...(isEnvProduction
            ? {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
              },
            }
            : {}),
        }),
      ),
      isEnvProduction
        && new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          // filename: "[name].[contenthash:8].css",
          // chunkFilename: "[name].[contenthash:8].chunk.css",
        }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.__VERSION__': JSON.stringify(appPkg.version),
        'process.env.__LICENSE__': JSON.stringify(appPkg.license),
        'process.env.__BUILD_DATE__': JSON.stringify(buildId),
        'process.env.__APP_CONTEXT__': JSON.stringify('/'),
        'process.env.__DEBUG__': JSON.stringify(isEnvDevelopment),
        // TODO: Add others..., or even better: env.stringified from https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js#L653
      }),
      new Dotenv({
        path: path.join(workspacePath, '.env'), // load this now instead of the ones in '.env'
        safe: false, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
        allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
        systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
        silent: true, // hide any errors
        defaults: false, // load '.env.defaults' as the default values if empty.
      }),
      copyPluginPatterns.length > 0
        && new CopyPlugin({
          patterns: copyPluginPatterns,
        }),
      // For each workspace repo, create an instance of the TS checker to typecheck.
      ...workspaceRepos.map(
        (repo) => !isFastMode && isEnvDevelopment
          && new ForkTsCheckerWebpackPlugin({
            async: isEnvDevelopment,
            typescript: {
              diagnosticOptions: {
                semantic: true,
                syntactic: true,
              },
              // Build the repo and type-check
              build: Object.keys(resolveAliases).length === 0,
              mode: 'write-references',
              // Use the corresponding config file of the repo folder
              configFile: path.join(workspacePath, repo, 'tsconfig.json'),
              // TODO: Add explanation
              configOverwrite: {
                compilerOptions: {
                  // Similarly to the webpack-alias definition, we need to define the same alias for typescript
                  baseUrl: '.',
                  sourceMap: true,
                  skipLibCheck: true,
                  inlineSourceMap: false,
                  declarationMap: false,
                  noEmit: false,
                  incremental: true,
                  paths: Object.assign(
                    {},
                    // Map the aliases to the same path, but within an array like tsc requires it
                    Object.fromEntries(Object.entries(resolveAliases).map(([alias, aliasPath]) => [alias, [aliasPath]])),
                    ...(!isSingleRepoMode
                      ? workspaceRepos.map((r) => ({
                        [`${workspaceRepoToName[r]}/dist`]: [path.join(workspacePath, r, 'src/*')],
                        [workspaceRepoToName[r]]: [path.join(workspacePath, r, 'src/index.ts')],
                      }))
                      : [
                        {
                          [`${libName}/dist`]: path.join(workspacePath, 'src/*'),
                          [libName]: path.join(workspacePath, 'src/index.ts'),
                        },
                      ]),
                  ),
                },
              },
            },
          }),
      ),
      /*
      // For each workspace repo, create an instance of the ESLint plugin
      ...workspaceRepos.map(
        (repo) =>
          new ESLintPlugin({
            // Plugin options
            // context: path.join(workspacePath, repo),
            cache: true,
            // cacheLocation: path.join(
            //   paths.appNodeModules,
            //   '.cache/.eslintcache'
            // ),
            // ESLint class options
            cwd: path.join(workspacePath, repo),
            // resolvePluginsRelativeTo: __dirname,
          })
      ),
      */
      isEnvProduction
        && new webpack.BannerPlugin({
          banner: `/*! ${appPkg.title || appPkg.name} - v${appPkg.version} - ${year}\n${
            appPkg.homepage ? `* ${appPkg.homepage}\n` : ''
          }* Copyright (c) ${year} ${appPkg.author?.name}; Licensed ${appPkg.license}*/\n`,
          raw: true,
        }),
      // For debugging issues
      false
        && new BundleAnalyzerPlugin({
          // set to 'server' to start analyzer during build
          analyzerMode: 'disabled',
          generateStatsFile: true,
          statsOptions: { source: false },
        }),
    ].filter(Boolean),
    // Ignore some warnings, like failing to parse source maps
    ignoreWarnings: [/Failed to parse source map/],
  };
};
