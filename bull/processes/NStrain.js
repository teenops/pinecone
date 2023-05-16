const fs = require('fs')
const path = require('path')
const Scan = require('../../models/Scan')
const FileUpload = require('../../models/FileUpload')

const { runNsTrain } = require('../../utils/nerfHelper')
const { downloadAndUnzipFromS3, zipAndUploadToS3 } = require('../../utils/s3Helper')
const { S3_BUCKET_NAME } = require('../../utils/const')


async function processer(job) {
  console.log('[Ns-train] Job started :', job.data)
  let { scanId, inputFolder } = job.data
  const scanObj = await Scan.findById(scanId).populate({ path: 'nsProcessFile', select: 'key' })
  if (!scanObj) throw new Error('Scan not found')

  if (!scanObj.nsProcessFile) throw new Error('NS Process not found')

  const tmpFolderPath = path.join(__dirname, '..', '..', 'tmp')
  if (!inputFolder) {
    await downloadAndUnzipFromS3({
      key: scanObj.nsProcessFile.key,
      dirPath: path.join(tmpFolderPath, scanId.toString()),
      bucket: S3_BUCKET_NAME.NERF
    })
    inputFolder = path.join(tmpFolderPath, scanId.toString())
  }

  // check if inputFolder Folder exists
  if (!fs.existsSync(inputFolder)) {
    throw new Error('Input Folder not found')
  }

  // run ns-train on inputFolder
  const nsTrainOutput = path.join(tmpFolderPath, scanId.toString(), 'ns_train')
  await runNsTrain({
    inputPath: inputFolder,
    outputPath: nsTrainOutput
  })

  // outputFolder -> zip -> upload to s3
  const nsTrainKey = `scans/${scanId}/ns-train.zip`
  let fileObj = await zipAndUploadToS3({
    folderPath: nsTrainOutput,
    key: nsTrainKey,
    bucket: S3_BUCKET_NAME.NERF,
  })

  // add s3 key to db
  fileObj = await FileUpload.create(fileObj)
  await Scan.updateOne({ _id: scanId }, { $set: { nsTrainFile: fileObj._id } })

  // remove tmp/scanId Folder
  fs.rmdir(path.join(tmpFolderPath, scanId.toString()), { recursive: true }, (err) => {
    if (err) {
      console.log('Error while deleting tmp folder', err)
    }
  })

  return 'ns-train Process Completed'
}

async function onCompleted(job, result) {
  console.log('Job completed with result:', result)
  await Scan.updateOne({ _id: job.data.scanId }, { $set: { status: 'Completed' } })
}

async function onFailed(job, err) {
  console.log('Job failed with error:', err)
  await Scan.updateOne({ _id: job.data.scanId }, { $set: { status: 'Failed', failed_reason: err.message } })
}

module.exports = { processer, onCompleted, onFailed }
