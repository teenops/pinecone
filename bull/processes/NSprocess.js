const fs = require('fs')
const path = require('path')
const Scan = require('./../../models/Scan')
const FileUpload = require('./../../models/FileUpload')

const { runNsProcess } = require('../../utils/nerfHelper')
const { downloadFileFromS3, zipAndUploadToS3 } = require('../../utils/s3Helper')
const { S3_BUCKET_NAME } = require('../../utils/const')
const { addToNStrainQueue } = require('../NStrainQueue')


async function processer(job) {
  console.log('[Ns-process] Job started :', job.data)
  const { scanId } = job.data
  const scanObj = await Scan.findById(scanId).populate({ path: 'inputVideoId', select: 'key' })

  // update status to processing
  scanObj.status = 'In Progress'
  await scanObj.save()

  const baseDirectoryPath = path.join(__dirname, '..', '..')

  // download video from s3
  const ViddirectoryPath = path.join(baseDirectoryPath, 'tmp')
  const videoPath = await downloadFileFromS3({
    key: scanObj.inputVideoId.key,
    dirPath: ViddirectoryPath,
    bucket: S3_BUCKET_NAME.VIDEO
  })


  // run ns-process on video
  const nsProcessOutput = path.join(baseDirectoryPath, 'tmp', scanId.toString(), 'ns_process')
  await runNsProcess({
    inputPath: videoPath,
    outputPath: nsProcessOutput
  })

  // colmap + imanges -> zip -> upload to s3
  const nsProcessKey = `scans/${scanId}/ns-process.zip`
  let fileObj = await zipAndUploadToS3({
    folderPath: nsProcessOutput,
    key: nsProcessKey,
    bucket: S3_BUCKET_NAME.NERF,
  })

  // add s3 key to db
  fileObj = await FileUpload.create(fileObj)
  await Scan.updateOne({ _id: scanId }, { $set: { nsProcessFile: fileObj._id } })

  //delete video file
  fs.rm(videoPath, (err) => {
    if (err) {
      console.log('Error while deleting video file', err)
    }
  })

  // start ns-train job
  addToNStrainQueue({ scanId, inputFolder: nsProcessOutput })

  return 'Colmap Created.'
}

async function onCompleted(job, result) {
  console.log('Job completed with result:', result)
  // await Scan.updateOne({ _id: job.data.scanId }, { $set: { status: 'Completed' } })
}

async function onFailed(job, err) {
  console.log('Job failed with error:', err)
  await Scan.updateOne({ _id: job.data.scanId }, { $set: { status: 'Failed', failed_reason: err.message } })
}

module.exports = { processer, onCompleted, onFailed }
