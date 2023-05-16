const Bull = require('bull')
const { processer, onCompleted, onFailed } = require('./processes/NSprocess')

const NSprocessQueue = new Bull('ns-process', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB
  },
  settings: {
    stalledInterval: 3600000, // 1 hour
  },

})

if (process.env.NERF_PROCESS === 'true') {
  NSprocessQueue.process(processer)
}

NSprocessQueue.on('completed', onCompleted)

NSprocessQueue.on('failed', onFailed)

const addToNSprocessQueue = (data) => {
  NSprocessQueue.add(data)
}

module.exports = {
  NSprocessQueue,
  addToNSprocessQueue
}
