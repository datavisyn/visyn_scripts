const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

module.exports = {
  command: 'copy',
  describe: 'Copy assets, styles, and static files to the dist folder',
  handler: () => {
    const srcDir = 'src';
    const distDir = 'dist';
    // Files to copy
    const filePattern = '**/*.@(txt|html|ejs|json|md|scss|css|js|png|jpg|jpeg|gif|svg|ico|webmanifest|xml)';

    // Additional folders to copy
    const additionalFolders = ['assets', 'template', 'templates', 'scss'];

    // Copy specified folders from source to destination
    additionalFolders.forEach((folder) => {
      const srcFolderPath = path.join(srcDir, folder);

      if (fs.existsSync(srcFolderPath)) {
        const distFolderPath = path.join(distDir, folder);

        // Ensure the destination directory exists
        fs.ensureDirSync(distFolderPath);

        // Copy the folder from source to destination
        fs.copySync(srcFolderPath, distFolderPath, { overwrite: true });
        console.log(`Copied ${srcFolderPath} to ${distFolderPath}`);
      }
    });

    // Get a list of files matching the pattern
    const files = glob.sync(filePattern, { cwd: srcDir });
    files.forEach((file) => {
      const srcPath = path.join(srcDir, file);
      const distPath = path.join(distDir, file);

      // Ensure the destination directory exists
      const distDirPath = path.dirname(distPath);
      fs.ensureDirSync(distDirPath);

      // Copy the file from source to destination
      fs.copyFileSync(srcPath, distPath);
      console.log(`Copied ${srcPath} to ${distPath}`);
    });
  },
};
