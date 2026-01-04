const mongoose = require("mongoose")

async function connectDB() {
    if (!process.env.DB_CONNECTION_STRING) {
        throw new Error("Missing DB_CONNECTION_STRING environment variable")
    }

    await mongoose.connect(process.env.DB_CONNECTION_STRING)
    console.log("Connected to MongoDB")
}

async function disconnectDB() {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
}

module.exports = { connectDB, disconnectDB }
