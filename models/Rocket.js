const mongoose = require("mongoose")
const Schema = mongoose.Schema

const RocketSchema = Schema({
    _id: Number,
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    info_url: {
        type: String,
    },
    wiki_url: {
        type: String,
    },
})

module.exports = mongoose.model("Rockets", RocketSchema)
