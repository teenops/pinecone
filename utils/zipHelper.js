const archiver = require('archiver');
const unzipper = require('unzipper')
const fs = require('fs')

function zipFolder({ inputFolderPath, outputFilePath }) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath);

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', err => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(inputFolderPath, false);
    archive.finalize();

    output.on('close', () => {
      resolve();
    });
  });
}

function unzip(inputFile, outputFile) {
  fs.createReadStream(inputFile).pipe(unzipper.Extract({ path: outputFile }))
}

module.exports = {
  zipFolder,
  unzip
}
