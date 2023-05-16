const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { pipeline } = require('stream/promises');
const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { zipFolder } = require('./zipHelper');
const { Upload } = require('@aws-sdk/lib-storage')

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS,
    secretAccessKey: process.env.S3_SECRET
  }
});


async function zipAndUploadToS3({ folderPath, key, bucket }) {

  const basePath = path.join(__dirname, '..', 'tmp');
  const zipFilePath = path.join(basePath, `${uuidv4()}.zip`);
  console.log("zipFilePath ->>", zipFilePath);
  console.time('zippingFolder ----------->');
  await zipFolder({ inputFolderPath: folderPath, outputFilePath: zipFilePath })
  console.timeEnd('zippingFolder ----------->');
  // const zipFilePath = path.join(basePath, `d5a1a270-f51c-4bb8-bb45-00fd3a1365c3.zip`);

  console.time('Uploading File to S3 ----------->');
  await uploadFileToS3({
    bucket,
    key,
    filePath: zipFilePath
  })
  console.timeEnd('Uploading File to S3 ----------->');

  // Get the object metadata to return basic details of the uploaded file
  const headObjectCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
  const metadata = await s3Client.send(headObjectCommand);

  // Return basic details of the uploaded file
  const { ContentType, ContentLength } = metadata;
  const filename = key.split('/').pop();
  const filepath = `https://${bucket}.s3.amazonaws.com/${key}`;
  const mimetype = ContentType;

  console.log(`Successfully uploaded ${key} to ${bucket}`);
  return { mimetype, key, filepath, size: ContentLength, filename, originalname: filename };
}

async function downloadAndUnzipFromS3({ key, dirPath, bucket }) {

  // Download the zip file from S3
  const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
  const objectStream = await s3Client.send(getObjectCommand);

  // Create a buffer to store the zip file contents
  const buffer = [];
  for await (const chunk of objectStream.Body) {
    buffer.push(chunk);
  }

  // Extract the zip file
  const zip = new AdmZip(Buffer.concat(buffer));
  zip.extractAllTo(dirPath);

  console.log(`Successfully downloaded and extracted ${key} from ${bucket}`);

  return dirPath;
}

async function downloadFileFromS3({ key, dirPath, bucket }) {
  const params = {
    Bucket: bucket,
    Key: key
  };
  const fileName = key.split('/').pop();
  const data = await s3Client.send(new GetObjectCommand(params));
  console.log(`Successfully downloaded ${fileName} from ${bucket}`);
  const fileStream = fs.createWriteStream(`${dirPath}/${fileName}`);
  await pipeline(data.Body, fileStream);
  return `${dirPath}/${fileName}`;
}


async function uploadFileToS3({ bucket, key, filePath }) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath)
    }
  })

  let result = await upload.done()
  fs.rm(filePath, () => { })
  return result
}

module.exports = {
  zipAndUploadToS3,
  downloadAndUnzipFromS3,
  downloadFileFromS3
};