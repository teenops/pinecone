const Bull = require('bull')
const { processer, onCompleted, onFailed } = require('./processes/NStrain')

const NStrainQueue = new Bull('ns-train', {
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
  NStrainQueue.process(processer)
}

NStrainQueue.on('completed', onCompleted)

NStrainQueue.on('failed', onFailed)

const addToNStrainQueue = (data) => {
  NStrainQueue.add(data)
}

module.exports = {
  NStrainQueue,
  addToNStrainQueue
}
