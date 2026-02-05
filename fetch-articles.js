require("dotenv/config")
const { connectDB, disconnectDB } = require("./db_connection")
const Article = require("./models/Article")

async function fetchArticles() {
    if (!process.env.ARTICLES_LINK) {
        throw new Error("[Articles API] Missing ARTICLES_LINK environment variable")
    }

    const url = process.env.ARTICLES_LINK
    console.log(`[Articles API] Fetching from: ${url}`)

    let response
    try {
        response = await fetch(url)
    } catch (error) {
        throw new Error(`[Articles API] Network error - failed to reach API.\nURL: ${url}\nDetails: ${error.message}`)
    }

    if (!response.ok) {
        let errorBody = ""
        try {
            errorBody = await response.text()
        } catch {
            errorBody = "(unable to read response body)"
        }
        throw new Error(`[Articles API] Request failed with status ${response.status} ${response.statusText}\nURL: ${url}\nResponse: ${errorBody.slice(0, 500)}`)
    }

    try {
        return await response.json()
    } catch (error) {
        throw new Error(`[Articles API] Failed to parse JSON response.\nURL: ${url}\nDetails: ${error.message}`)
    }
}

async function syncArticles() {
    const data = await fetchArticles()
    const articles = data.results

    if (!Array.isArray(articles)) {
        throw new Error(`[Articles Sync] Unexpected API response - 'results' is not an array.\nReceived: ${JSON.stringify(data).slice(0, 200)}`)
    }

    console.log(`[Articles Sync] Processing ${articles.length} articles...`)

    let successCount = 0
    const errors = []

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i]
        const articleTitle = article.title?.slice(0, 50) || `ID: ${article.id}`

        try {
            if (!article.id) {
                throw new Error("Missing article id")
            }

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

            successCount++
        } catch (error) {
            const errorMsg = `[Articles Sync] Failed to process article ${i + 1}/${articles.length} "${articleTitle}": ${error.message}`
            console.error(errorMsg)
            errors.push({ index: i, title: articleTitle, error: error.message })
        }
    }

    // Summary logging
    if (errors.length > 0) {
        console.error(`[Articles Sync] Completed with ${errors.length} error(s):`)
        errors.forEach(e => console.error(`  - Article "${e.title}": ${e.error}`))
    }
    console.log(`[Articles Sync] Complete! ${successCount}/${articles.length} articles processed successfully.`)

    if (errors.length > 0 && successCount === 0) {
        throw new Error(`[Articles Sync] All ${articles.length} articles failed to process. See errors above.`)
    }

    return successCount
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
            console.error("\n========== ARTICLES SYNC FAILED ==========")
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

module.exports = { syncArticles }
