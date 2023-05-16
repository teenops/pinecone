const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require('stream');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Function to upload a file to an S3 bucket
async function uploadFileToS3(bucketName, fileName, fileData) {
    try {
        const stream = Readable.from(fileData); // convert the fileData to a readable stream
        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: stream
        };
        await s3.send(new PutObjectCommand(params));
        console.log(`Successfully uploaded ${fileName} to ${bucketName}`);
    } catch (error) {
        console.error(`Error uploading ${fileName} to ${bucketName}: ${error}`);
    }
}

// Function to download a file from an S3 bucket
async function downloadFileFromS3(bucketName, fileName) {
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName
        };
        const data = await s3.send(new GetObjectCommand(params));
        console.log(`Successfully downloaded ${fileName} from ${bucketName}`);
        return data.Body;
    } catch (error) {
        console.error(`Error downloading ${fileName} from ${bucketName}: ${error}`);
        return null;
    }
}
