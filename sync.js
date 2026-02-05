require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const { syncLaunches } = require("./fetch-launches")
const { syncArticles } = require("./fetch-articles")

async function syncAll() {
    console.log("============================================")
    console.log("       GROUND CONTROL DATA SYNC")
    console.log(`       Started: ${new Date().toISOString()}`)
    console.log("============================================\n")

    const results = {
        launches: { count: 0, status: "pending", error: null },
        articles: { count: 0, status: "pending", error: null },
    }

    // Sync launches
    console.log("[Step 1/2] Syncing launches...")
    try {
        results.launches.count = await syncLaunches()
        results.launches.status = "success"
    } catch (error) {
        results.launches.status = "failed"
        results.launches.error = error
        console.error(`[Step 1/2] Launches sync failed: ${error.message}`)
    }

    console.log("")

    // Sync articles
    console.log("[Step 2/2] Syncing articles...")
    try {
        results.articles.count = await syncArticles()
        results.articles.status = "success"
    } catch (error) {
        results.articles.status = "failed"
        results.articles.error = error
        console.error(`[Step 2/2] Articles sync failed: ${error.message}`)
    }

    // Print summary
    console.log("\n============================================")
    console.log("              SYNC SUMMARY")
    console.log("============================================")
    console.log(`Launches: ${results.launches.count} synced (${results.launches.status})`)
    console.log(`Articles: ${results.articles.count} synced (${results.articles.status})`)
    console.log(`Finished: ${new Date().toISOString()}`)
    console.log("============================================\n")

    // If either sync failed, throw to indicate overall failure
    const failures = []
    if (results.launches.status === "failed") failures.push("launches")
    if (results.articles.status === "failed") failures.push("articles")

    if (failures.length > 0) {
        const error = new Error(`Sync completed with failures in: ${failures.join(", ")}`)
        // Attach details for the main error handler
        error.results = results
        throw error
    }

    return results
}

(async () => {
    let currentStep = "initialization"

    try {
        currentStep = "database connection"
        await connectDB()

        currentStep = "data sync"
        await syncAll()

        currentStep = "database disconnection"
        await disconnectDB()

        console.log("[Success] Full sync completed successfully!")
        process.exit(0)
    } catch (error) {
        console.error("\n##############################################")
        console.error("              SYNC FAILED")
        console.error("##############################################")
        console.error(`Failed during: ${currentStep}`)
        console.error(`Error: ${error.message}`)

        // Print detailed error info if available
        if (error.results) {
            if (error.results.launches.error) {
                console.error("\n--- Launches Error Details ---")
                console.error(error.results.launches.error.message)
                if (error.results.launches.error.stack) {
                    console.error(error.results.launches.error.stack)
                }
            }
            if (error.results.articles.error) {
                console.error("\n--- Articles Error Details ---")
                console.error(error.results.articles.error.message)
                if (error.results.articles.error.stack) {
                    console.error(error.results.articles.error.stack)
                }
            }
        } else if (error.stack) {
            console.error("\nStack trace:")
            console.error(error.stack)
        }

        console.error("##############################################\n")

        // Try to disconnect gracefully even on error
        try {
            await disconnectDB()
        } catch {
            // Ignore disconnect errors during failure cleanup
        }

        process.exit(1)
    }
})()
