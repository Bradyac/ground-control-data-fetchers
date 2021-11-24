const mongoose = require("mongoose")
const Schema = mongoose.Schema

const MissionSchema = Schema({
    _id: Number,
    name: {
        type: String,
    },
    type: {
        type: String,
    },
    description: {
        type: String,
    },
})

module.exports = mongoose.model("Missions", MissionSchema)
