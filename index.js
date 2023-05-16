require('dotenv').config()
const http = require('http');
const https = require('https')
const fs = require('fs')
const app = require('./config/express')
const connectDB = require('./config/db')

connectDB();
let server;

if (process.env.PROTOCOL === 'https') {
    console.log("Https Server Stated.");
    server = https.createServer({
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT)
    }, app)
} else {
    console.log("Http Server Stated.");
    server = http.createServer(app)
}


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});