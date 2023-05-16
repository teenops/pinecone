const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const { ExpressAdapter } = require('@bull-board/express')

const { NSprocessQueue } = require('./NSprocessQueue')
const { NStrainQueue } = require('./NStrainQueue')

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/bull')

const BullBoard = createBullBoard({
  queues: [
    new BullAdapter(NSprocessQueue),
    new BullAdapter(NStrainQueue),
  ],
  serverAdapter: serverAdapter
})

module.exports = serverAdapter
