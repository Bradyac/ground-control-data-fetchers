require("dotenv/config")
require("./db_connection")
require("mongoose")
const fetch = require("node-fetch")
const Launch = require("./models/Launch")
const Rocket = require("./models/Rocket")
const Mission = require("./models/Mission")
const Pad = require("./models/Pad")
const Provider = require("./models/Provider")

async function fetchUpcomingLaunches() {
    return await fetch(process.env.LAUNCHES_LINK).then((res) => res.json())
}

async function insertUpcomingLaunches(launches) {
    for (var i = 0; i < launches.length; i++) {
        const launch = launches[i]

        // launch rocket (Ex. Falcon 9)
        const rocketPath = launch.rocket.configuration
        const rocket = new Rocket({
            _id: rocketPath.id,
            name: rocketPath.name,
            description: rocketPath.description,
            info_url: rocketPath.info_url,
            wiki_url: rocketPath.wiki_url,
        })
        await Rocket.updateOne({ _id: rocket.id }, rocket, { upsert: true })

        // launch mission (sometimes null)
        var mission = null
        const missionPath = launch.mission
        if (missionPath) {
            mission = new Mission({
                _id: missionPath.id,
                name: missionPath.name,
                type: missionPath.type,
                description: missionPath.description,
            })
            await Mission.updateOne({ _id: mission.id }, mission, { upsert: true })
        }

        // launch pad (Ex. Boca Chica)
        const padPath = launch.pad
        const pad = new Pad({
            _id: padPath.id,
            location_name: padPath.name,
            wiki_url: padPath.wiki_url,
            map_url: padPath.map_url,
            map_image_url: padPath.map_image,
        })
        await Pad.updateOne({ _id: pad.id }, pad, { upsert: true })

        // launch provider (Ex. SpaceX)
        const providerPath = launch.launch_service_provider
        const provider = new Provider({
            _id: providerPath.id,
            name: providerPath.name,
            country_code: providerPath.country_code,
            description: providerPath.description,
            logo_url: providerPath.logo_url,
            info_url: providerPath.info_url,
            wiki_url: providerPath.wiki_url,
        })
        await Provider.updateOne({ _id: provider.id }, provider, { upsert: true })

        const upcomingLaunch = new Launch({
            _id: launch.id,
            name: launch.name,
            status: launch.status.id,
            date: launch.net,
            slug: launch.slug,
            image_url: launch.image,
            watch_url: launch.vidURLs[0] ? launch.vidURLs[0].url : null,
            rocket: rocket._id,
            mission: mission ? mission._id : null,
            pad: pad._id,
            provider: provider._id,
        })
        await Launch.updateOne({ _id: upcomingLaunch.id }, upcomingLaunch, { upsert: true })
    }
    process.exit(0)
}

fetchUpcomingLaunches().then((launches) => insertUpcomingLaunches(launches.results))
