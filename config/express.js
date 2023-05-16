const express = require('express')
const app = express()
const routes = require('./../routes')
const cors = require('cors')
const BullAdapter = require('../bull')

app.use(cors())
app.use(function (req, res, next) {
res.header('Access-Control-Allow-Origin', '*')
res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
next()
})
app.use(express.json())
app.use('/admin/bull', BullAdapter.getRouter())

app.get('/', (req, res) => {
    res.send("Success")
})

app.get('/health', (req, res) => {
    res.json({
        status: 200,
        date: new Date()
    })
})

app.use('/', routes)

module.exports = app