require("dotenv/config")
require("./db_connection")
require("mongoose")
const fetch = require("node-fetch")
const Article = require("./models/Article")

async function fetch_articles() {
    return await fetch(process.env.ARTICLES_LINK).then((res) => res.json())
}

async function insert_articles(articles) {
    console.log(`Processing ${articles.length} articles...`)

    for (var i = 0; i < articles.length; i++) {
        const current_article = articles[i]
        const article = new Article({
            _id: current_article.id,
            title: current_article.title,
            url: current_article.url,
            image_url: current_article.image_url,
            news_site: current_article.news_site,
            summary: current_article.summary,
            published_date: current_article.published_at,
            updated_date: current_article.updated_at,
            featured: current_article.featured,
            launches: current_article.launches,
            events: current_article.events,
        })
        await Article.updateOne({ _id: current_article.id }, article, { upsert: true })
    }
    console.log("Articles sync complete!")
    process.exit(0)
}

// SNAPI v4 returns paginated response with results array
fetch_articles().then((response) => insert_articles(response.results))
