const path = require('path');
const fs = require('fs');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const parsedEnv = dotenvExpand.expand(dotenv.config());

module.exports = (webpackEnv, argv) => {
    const env = {
        ...(parsedEnv.parsed || {}),
        ...(webpackEnv || {}),
      };

    const isSingleRepoMode = true;

    const { mode } = argv;

    const now = new Date();
    const year = now.getFullYear();
    const prefix = (n) => (n < 10 ? `0${n}` : n.toString());
    const buildId = `${now.getUTCFullYear()}${prefix(now.getUTCMonth() + 1)}${prefix(now.getUTCDate())}-${prefix(now.getUTCHours())}${prefix(now.getUTCMinutes())}${prefix(now.getUTCSeconds())}`;
    
    const isEnvDevelopment = mode === 'development';
    const isEnvProduction = mode === 'production';
    const isFastMode = env.fast?.toLowerCase() === 'true';
    const cssRegex = /\.css$/;
    const cssModuleRegex = /\.module\.css$/;
    const sassRegex = /\.(scss|sass)$/;
    const sassModuleRegex = /\.module\.(scss|sass)$/;

    const workspacePath = fs.realpathSync(process.cwd());

    const defaultApp = isSingleRepoMode ? './' : workspaceYoRcFile.defaultApp;
    const defaultAppPath = path.join(workspacePath, defaultApp);
    const appPkg = require(path.join(defaultAppPath, 'package.json'));
    const workspaceRegistryFile = path.join(workspacePath, isSingleRepoMode ? 'src/' : '', 'phovea_registry.ts');

    const workspaceYoRcFile = fs.existsSync(path.join(workspacePath, '.yo-rc-workspace.json')) ? require(path.join(workspacePath, '.yo-rc-workspace.json')) : {};

    const workspaceMaxChunkSize = 5000000;

    const resolveAliases = Object.fromEntries(Object.entries({}).map(([key, p]) => [key, path.join(workspacePath, p)]));
    // Use a regex with capturing group as explained in https://github.com/webpack/webpack/pull/14509#issuecomment-1237348087.
    const customResolveAliasRegex = Object.entries(resolveAliases).length > 0 ? new RegExp(`/^(.+?[\\/]node_modules[\\/](?!(${Object.keys(resolveAliases).join('|')}))(@.+?[\\/])?.+?)[\\/]/`) : null;

    const workspaceProxy = { ...(appPkg.visyn.devServerProxy || {}), ...(workspaceYoRcFile.devServerProxy || {}) };

    const libName = appPkg.name;
    const libDesc = appPkg.description;

    const useTailwind = fs.existsSync(path.join(workspacePath, 'tailwind.config.js'));
    const sourceMap = !isFastMode && (isEnvProduction ? shouldUseSourceMap : isEnvDevelopment);

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

    let {
        // eslint-disable-next-line prefer-const
        entries, registry, copyFiles, historyApiFallback,
      } = appPkg.visyn;


      console.log(Object.fromEntries(
        Object.entries(entries).map(([key, entry]) => [
          key,
          [workspaceRegistryFile, path.join(defaultAppPath, entry.js), entry.scss ? path.join(defaultAppPath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
        ]),
    ));

      return {
        entry: Object.fromEntries(
            Object.entries(entries).map(([key, entry]) => [
              key,
              [workspaceRegistryFile, path.join(defaultAppPath, entry.js), entry.scss ? path.join(defaultAppPath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
            ]),
        ),
        output: {
            filename: 'main.js',
            path: path.join(workspacePath, 'bundles'),
        },
        builtins: {
            define: {
                'process.env.NODE_ENV': JSON.stringify(mode),
                'process.env.__VERSION__': JSON.stringify(appPkg.version),
                'process.env.__LICENSE__': JSON.stringify(appPkg.license),
                'process.env.__BUILD_ID__': JSON.stringify(buildId),
                'process.env.__APP_CONTEXT__': JSON.stringify('/'),
                'process.env.__DEBUG__': JSON.stringify(isEnvDevelopment),
            },
            html: Object.entries(entries).map(
                ([chunkName, entry]) => {
                    console.log({
                        template: entry.template ? path.join(defaultAppPath, entry.template) : 'auto',
                        filename: entry.html || `${chunkName}.html`,
                        title: libName,
                        // By default, exclude all other chunks
                        excludedChunks: entry.excludeChunks || Object.keys(entries).filter((entryKey) => entryKey !== chunkName),
                        meta: {
                          description: libDesc,
                        },
                        minify: isEnvProduction,
                      })
                    return {
                  template: entry.template ? path.join(defaultAppPath, entry.template) : 'auto',
                  filename: entry.html || `${chunkName}.html`,
                  title: libName,
                  // By default, exclude all other chunks
                  excludedChunks: entry.excludeChunks || Object.keys(entries).filter((entryKey) => entryKey !== chunkName),
                  meta: {
                    description: libDesc,
                  },
                  minify: isEnvProduction,
                }
             },
              )
        },
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
              ...workspaceProxy,
            },
          },
          client: {
            // Do not show the full-page error overlay
            overlay: false,
          },
        }
        : undefined,
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
    }
};