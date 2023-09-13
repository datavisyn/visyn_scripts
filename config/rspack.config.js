const path = require('path');
const fs = require('fs');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const dotenv = require('dotenv');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('rspack-plugin-dotenv');
const dotenvExpand = require('dotenv-expand');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
    const workspaceRepos = isSingleRepoMode ? ['./'] : workspaceYoRcFile.frontendRepos || [];
    const workspaceMaxChunkSize = 5000000;
    const workspaceBuildInfoFile = path.join(workspacePath, 'package-lock.json');
    const workspaceMetaDataFile = path.join(workspacePath, 'metaData.json');
    
    let {
      // eslint-disable-next-line prefer-const
      entries, registry, copyFiles, historyApiFallback,
    } = appPkg.visyn;

    const resolveAliases = Object.fromEntries(Object.entries({}).map(([key, p]) => [key, path.join(workspacePath, p)]));
    // Use a regex with capturing group as explained in https://github.com/webpack/webpack/pull/14509#issuecomment-1237348087.
    const customResolveAliasRegex = Object.entries(resolveAliases).length > 0 ? new RegExp(`/^(.+?[\\/]node_modules[\\/](?!(${Object.keys(resolveAliases).join('|')}))(@.+?[\\/])?.+?)[\\/]/`) : null;

    const workspaceProxy = { ...(appPkg.visyn.devServerProxy || {}), ...(workspaceYoRcFile.devServerProxy || {}) };

    const libName = appPkg.name;
    const libDesc = appPkg.description;

    const useTailwind = fs.existsSync(path.join(workspacePath, 'tailwind.config.js'));
    const sourceMap = !isFastMode && (isEnvProduction ? true : isEnvDevelopment);

    const copyAppFiles = copyFiles?.map((file) => ({
      from: path.join(defaultAppPath, file),
      to: path.join(workspacePath, 'bundles', path.basename(file)),
    })) || [];

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

  




      console.log(Object.fromEntries(
        Object.entries(entries).map(([key, entry]) => [
          key,
          [workspaceRegistryFile, path.join(defaultAppPath, entry.js), entry.scss ? path.join(defaultAppPath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
        ]),
    ));


    console.log(new Dotenv({
      path: path.join(workspacePath, '.env'), // load this now instead of the ones in '.env'
      safe: false, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
      allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
      silent: true, // hide any errors
      defaults: false, // load '.env.defaults' as the default values if empty.
    }));

      return {
        entry: Object.fromEntries(
            Object.entries(entries).map(([key, entry]) => [
              key,
              [workspaceRegistryFile, path.join(defaultAppPath, entry.js), entry.scss ? path.join(defaultAppPath, entry.scss) : './workspace.scss'].filter((v) => fs.existsSync(v)),
            ]),
        ),
        cache: true,
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
        plugins: [
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
        ],
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
                  {
                    test: /\.css$/i,
                    type: "css", // this is enabled by default for .css, so you don't need to specify it
                  },
                  {
                    test: sassRegex,
                    use: [
                      {
                        loader: require.resolve('resolve-url-loader'),
                        options: {
                          sourceMap,
                          // root: paths.appSrc,
                        },
                      },
                      {
                        loader: 'sass-loader',
                        options: {
                          // ...
                        },
                      },
                    ],
                    type: 'css',
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