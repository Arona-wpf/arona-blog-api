const { ZipArchive } = require('archiver');
const deleteAsync = require('del');
const fs = require('fs');
const gulp = require('gulp');
const shell = require('gulp-shell');

const projectName = require('./package.json').name;
const projectVersion = require('./package.json').version;

const buildProject = `build/${projectName}`;
const buildZip = `${projectName}-${projectVersion}.zip`;

gulp.task('clean', () => deleteAsync(['build/**', '!*.zip']));

gulp.task('lint:fix', shell.task(['yarn lint:fix']));

gulp.task('lint', shell.task(['yarn lint']));

gulp.task('tsc', shell.task(['mwtsc --cleanOutDir']));

gulp.task('copy', () =>
  gulp
    .src(['dist/**', 'bootstrap.js', 'package.json', 'yarn.lock'], {
      base: './',
    })
    .pipe(gulp.dest(buildProject))
);

gulp.task('del-dup-build', () => deleteAsync(['build/**', `!${buildProject}`]));

gulp.task(
  'yarn',
  shell.task([`cd ${buildProject} && yarn workspaces focus --production`])
);

gulp.task('zip', async () => {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const output = fs.createWriteStream(`build/${buildZip}`);
  output.on('close', () => {
    console.log(
      'Packaging completed, compressed package size:' +
        (archive.pointer() / 1024 / 1024).toFixed(2) +
        ' MB'
    );
  });
  archive.pipe(output);
  archive.directory(buildProject, projectName);
  return await archive.finalize();
});

exports.default = gulp.series(
  'clean',
  'lint:fix',
  'lint',
  'tsc',
  'copy',
  'del-dup-build',
  'yarn',
  'zip'
);
