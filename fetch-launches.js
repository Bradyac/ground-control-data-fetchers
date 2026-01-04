require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const Launch = require("./models/Launch")
const Rocket = require("./models/Rocket")
const Mission = require("./models/Mission")
const Pad = require("./models/Pad")
const Provider = require("./models/Provider")

async function fetchUpcomingLaunches() {
    if (!process.env.LAUNCHES_LINK) {
        throw new Error("Missing LAUNCHES_LINK environment variable")
    }

    const response = await fetch(process.env.LAUNCHES_LINK)

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

async function syncLaunches() {
    const data = await fetchUpcomingLaunches()
    const launches = data.results

    console.log(`Processing ${launches.length} upcoming launches...`)

    for (const launch of launches) {
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
    }

    console.log("Launches sync complete!")
    return launches.length
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
            console.error("Launches sync failed:", error.message)
            process.exit(1)
        }
    })()
}

module.exports = { syncLaunches }
