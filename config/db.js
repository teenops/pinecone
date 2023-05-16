const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("DB Connected");
    }).catch(e => {
        console.log("DB ERROR:", e);
    })

    mongoose.set('debug', true)
}