const { spawn } = require('child_process');

function runNsProcess({ inputPath, outputPath }) {
  return new Promise((resolve, reject) => {
    // Set the name of the Conda environment
    const condaEnvironmentName = process.env.NERFSTUDIO_ENV || 'nerfstudio';

    // Activate the Conda environment using the 'conda activate' command
    const activateCommand = `conda activate ${condaEnvironmentName}`;
    // ns-process-data video --data ${videoData.file_path} --output-dir /content/data/nerfstudio/custom_data/${videoData._id}
    const nsStudioCommand = `ns-process-data video --data ${inputPath} --output-dir ${outputPath}`
    console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
    console.log(nsStudioCommand);
    console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
    // Use 'spawn' to execute the activation command followed by the 'ns-studio' command
    const nerfProcess = spawn('bash', ['-i', '-c', `${activateCommand} && ${nsStudioCommand}`]);

    // Handle the output and errors from the nerfProcess
    let output = '';
    let error = '';
    nerfProcess.stdout.on('data', (data) => {
      console.log(data.toString());
      output += data;
    });

    nerfProcess.stderr.on('data', (data) => {
      console.log(data.toString());
      error += data;
    });

    nerfProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(error);
      }
    });
  });
}

function runNsTrain({ inputPath, outputPath }) {
  return new Promise((resolve, reject) => {
    // Set the name of the Conda environment
    const condaEnvironmentName = process.env.NERFSTUDIO_ENV || 'nerfstudio';

    // Activate the Conda environment using the 'conda activate' command
    const activateCommand = `conda activate ${condaEnvironmentName}`;
    // ns-train nerfacto --data /content/data/nerfstudio/custom_data/5f9b1b1b0b9d2b0017b0b1a0 --output-dir /content/data/nerfstudio/custom_data/5f9b1b1b0b9d2b0017b0b1a0/output
    const nsStudioCommand = `ns-train nerfacto --data ${inputPath} --output-dir ${outputPath} --viewer.quit-on-train-completion True`

    // Use 'spawn' to execute the activation command followed by the 'ns-studio' command
    const NsTrainProcess = spawn('bash', ['-i', '-c', `${activateCommand} && ${nsStudioCommand}`]);

    // Handle the output and errors from the NsTrainProcess
    let output = '';
    let error = '';
    NsTrainProcess.stdout.on('data', (data) => {
      console.log(data.toString());
      output += data;
    });

    NsTrainProcess.stderr.on('data', (data) => {
      console.log(data.toString());
      error += data;
    });

    NsTrainProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(error);
      }
    });
  });
}


module.exports = {
  runNsProcess,
  runNsTrain
}