require("dotenv/config")
require("./db_connection")
require("mongoose")
const fetch = require("node-fetch")
const Article = require("./models/Article")

async function fetch_articles() {
    return await fetch(process.env.ARTICLES_LINK).then((res) => res.json())
}

async function insert_articles(articles) {
    for (var i = 0; i < articles.length; i++) {
        const current_article = articles[i]
        const article = new Article({
            _id: current_article.id,
            title: current_article.title,
            url: current_article.url,
            image_url: current_article.imageUrl,
            news_site: current_article.newsSite,
            summary: current_article.summary,
            published_date: current_article.publishedAt,
            updated_date: current_article.updatedAt,
        })
        await Article.updateOne({ _id: current_article.id }, article, { upsert: true })
    }
    process.exit(0)
}

fetch_articles().then((articles) => insert_articles(articles))
