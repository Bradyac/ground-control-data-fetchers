const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ProviderSchema = Schema({
    _id: Number,
    name: {
        type: String,
    },
    country_code: {
        type: String,
    },
    description: {
        type: String,
    },
    logo_url: {
        type: String,
    },
    info_url: {
        type: String,
    },
    wiki_url: {
        type: String,
    },
})

module.exports = mongoose.model("Providers", ProviderSchema)
