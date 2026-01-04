require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const { syncLaunches } = require("./fetch-launches")
const { syncArticles } = require("./fetch-articles")

async function syncAll() {
    console.log("Starting full sync...\n")

    const launchCount = await syncLaunches()
    console.log("")
    const articleCount = await syncArticles()

    console.log("\n--- Sync Summary ---")
    console.log(`Launches: ${launchCount}`)
    console.log(`Articles: ${articleCount}`)
}

(async () => {
    try {
        await connectDB()
        await syncAll()
        await disconnectDB()
        process.exit(0)
    } catch (error) {
        console.error("Sync failed:", error.message)
        process.exit(1)
    }
})()
