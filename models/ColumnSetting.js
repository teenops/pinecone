const mongoose = require('mongoose')

const ColumnSettingSchema = mongoose.Schema({
}, { strict: false })

module.exports = mongoose.model('column_settings', ColumnSettingSchema);