const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ArticleSchema = Schema({
    _id: Number,
    title: {
        type: String,
    },
    url: {
        type: String,
    },
    image_url: {
        type: String,
    },
    news_site: {
        type: String,
    },
    summary: {
        type: String,
    },
    published_date: {
        type: String,
    },
    updated_date: {
        type: String,
    },
})

module.exports = mongoose.model("Articles", ArticleSchema)
