const mongoose = require("mongoose")

async function connectDB() {
    if (!process.env.DB_CONNECTION_STRING) {
        throw new Error("[Database] Missing DB_CONNECTION_STRING environment variable")
    }

    console.log("[Database] Connecting to MongoDB...")
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        })
        console.log("[Database] Connected to MongoDB")
    } catch (error) {
        const message = error.message || "Unknown connection error"
        // Provide actionable error context
        if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
            throw new Error(`[Database] Connection failed - hostname not found. Check DB_CONNECTION_STRING.\nDetails: ${message}`)
        } else if (message.includes("Authentication") || message.includes("auth")) {
            throw new Error(`[Database] Connection failed - authentication error. Check credentials in DB_CONNECTION_STRING.\nDetails: ${message}`)
        } else if (message.includes("timed out") || message.includes("timeout")) {
            throw new Error(`[Database] Connection failed - timeout. Database may be unreachable or slow.\nDetails: ${message}`)
        } else {
            throw new Error(`[Database] Connection failed.\nDetails: ${message}`)
        }
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect()
        console.log("[Database] Disconnected from MongoDB")
    } catch (error) {
        console.error(`[Database] Warning - disconnect error: ${error.message}`)
        // Don't throw on disconnect errors, just log them
    }
}

module.exports = { connectDB, disconnectDB }
