require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const Launch = require("./models/Launch")
const Rocket = require("./models/Rocket")
const Mission = require("./models/Mission")
const Pad = require("./models/Pad")
const Provider = require("./models/Provider")

async function fetchUpcomingLaunches() {
    if (!process.env.LAUNCHES_LINK) {
        throw new Error("[Launches API] Missing LAUNCHES_LINK environment variable")
    }

    const url = process.env.LAUNCHES_LINK
    console.log(`[Launches API] Fetching from: ${url}`)

    let response
    try {
        response = await fetch(url)
    } catch (error) {
        throw new Error(`[Launches API] Network error - failed to reach API.\nURL: ${url}\nDetails: ${error.message}`)
    }

    if (!response.ok) {
        let errorBody = ""
        try {
            errorBody = await response.text()
        } catch {
            errorBody = "(unable to read response body)"
        }
        throw new Error(`[Launches API] Request failed with status ${response.status} ${response.statusText}\nURL: ${url}\nResponse: ${errorBody.slice(0, 500)}`)
    }

    try {
        return await response.json()
    } catch (error) {
        throw new Error(`[Launches API] Failed to parse JSON response.\nURL: ${url}\nDetails: ${error.message}`)
    }
}

async function syncLaunches() {
    const data = await fetchUpcomingLaunches()
    const launches = data.results

    if (!Array.isArray(launches)) {
        throw new Error(`[Launches Sync] Unexpected API response - 'results' is not an array.\nReceived: ${JSON.stringify(data).slice(0, 200)}`)
    }

    console.log(`[Launches Sync] Processing ${launches.length} upcoming launches...`)

    let successCount = 0
    const errors = []

    for (let i = 0; i < launches.length; i++) {
        const launch = launches[i]
        const launchName = launch.name || `ID: ${launch.id}`

        try {
            // Validate required nested data
            if (!launch.rocket?.configuration) {
                throw new Error("Missing rocket.configuration data")
            }
            if (!launch.pad) {
                throw new Error("Missing pad data")
            }
            if (!launch.launch_service_provider) {
                throw new Error("Missing launch_service_provider data")
            }
            if (!launch.status?.id) {
                throw new Error("Missing status.id data")
            }

            // Rocket (Ex. Falcon 9)
            const rocketData = launch.rocket.configuration
            await Rocket.updateOne(
                { _id: rocketData.id },
                {
                    _id: rocketData.id,
                    name: rocketData.name,
                    description: rocketData.description,
                    info_url: rocketData.info_url,
                    wiki_url: rocketData.wiki_url,
                },
                { upsert: true }
            )

            // Mission (sometimes null)
            let missionId = null
            if (launch.mission) {
                missionId = launch.mission.id
                await Mission.updateOne(
                    { _id: launch.mission.id },
                    {
                        _id: launch.mission.id,
                        name: launch.mission.name,
                        type: launch.mission.type,
                        description: launch.mission.description,
                    },
                    { upsert: true }
                )
            }

            // Pad (Ex. Boca Chica)
            const padData = launch.pad
            await Pad.updateOne(
                { _id: padData.id },
                {
                    _id: padData.id,
                    location_name: padData.name,
                    wiki_url: padData.wiki_url,
                    map_url: padData.map_url,
                    map_image_url: padData.map_image,
                },
                { upsert: true }
            )

            // Provider (Ex. SpaceX)
            const providerData = launch.launch_service_provider
            await Provider.updateOne(
                { _id: providerData.id },
                {
                    _id: providerData.id,
                    name: providerData.name,
                    country_code: providerData.country_code,
                    description: providerData.description,
                    logo_url: providerData.logo_url,
                    info_url: providerData.info_url,
                    wiki_url: providerData.wiki_url,
                },
                { upsert: true }
            )

            // Launch
            const watchUrl = launch.vidURLs?.length > 0 ? launch.vidURLs[0].url : null
            await Launch.updateOne(
                { _id: launch.id },
                {
                    _id: launch.id,
                    name: launch.name,
                    status: launch.status.id,
                    date: launch.net,
                    slug: launch.slug,
                    image_url: launch.image,
                    watch_url: watchUrl,
                    rocket: rocketData.id,
                    mission: missionId,
                    pad: padData.id,
                    provider: providerData.id,
                },
                { upsert: true }
            )

            successCount++
        } catch (error) {
            const errorMsg = `[Launches Sync] Failed to process launch ${i + 1}/${launches.length} "${launchName}": ${error.message}`
            console.error(errorMsg)
            errors.push({ index: i, name: launchName, error: error.message })
        }
    }

    // Summary logging
    if (errors.length > 0) {
        console.error(`[Launches Sync] Completed with ${errors.length} error(s):`)
        errors.forEach(e => console.error(`  - Launch "${e.name}": ${e.error}`))
    }
    console.log(`[Launches Sync] Complete! ${successCount}/${launches.length} launches processed successfully.`)

    if (errors.length > 0 && successCount === 0) {
        throw new Error(`[Launches Sync] All ${launches.length} launches failed to process. See errors above.`)
    }

    return successCount
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            await connectDB()
            await syncLaunches()
            await disconnectDB()
            process.exit(0)
        } catch (error) {
            console.error("\n========== LAUNCHES SYNC FAILED ==========")
            console.error(`Error: ${error.message}`)
            if (error.stack) {
                console.error("\nStack trace:")
                console.error(error.stack)
            }
            console.error("===========================================\n")
            process.exit(1)
        }
    })()
}

module.exports = { syncLaunches }
