require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const Article = require("./models/Article")

async function fetchArticles() {
    if (!process.env.ARTICLES_LINK) {
        throw new Error("Missing ARTICLES_LINK environment variable")
    }

    const response = await fetch(process.env.ARTICLES_LINK)

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

async function syncArticles() {
    const data = await fetchArticles()
    const articles = data.results

    console.log(`Processing ${articles.length} articles...`)

    for (const article of articles) {
        await Article.updateOne(
            { _id: article.id },
            {
                _id: article.id,
                title: article.title,
                url: article.url,
                image_url: article.image_url,
                news_site: article.news_site,
                summary: article.summary,
                published_date: article.published_at,
                updated_date: article.updated_at,
                featured: article.featured,
                launches: article.launches,
                events: article.events,
            },
            { upsert: true }
        )
    }

    console.log("Articles sync complete!")
    return articles.length
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            await connectDB()
            await syncArticles()
            await disconnectDB()
            process.exit(0)
        } catch (error) {
            console.error("Articles sync failed:", error.message)
            process.exit(1)
        }
    })()
}

module.exports = { syncArticles }
