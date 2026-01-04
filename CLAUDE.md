# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ground Control Fetcher syncs space launch and news data from external APIs into MongoDB Atlas. It's a one-time sync utility (not a persistent server) designed to run periodically.

## Commands

```bash
npm run sync       # Sync both launches and articles
npm run launches   # Sync only launches
npm run articles   # Sync only articles
npm run dev        # Run sync with nodemon (auto-reload)
```

## Architecture

### Entry Points
- **sync.js** - Unified script that runs both fetchers with a summary
- **fetch-launches.js** - Fetches upcoming launches from Launch Library 2 API
- **fetch-articles.js** - Fetches space news from Spaceflight News API v4

Each fetcher exports its sync function and can run standalone or be imported by sync.js.

### Database (`db_connection.js`)
- Exports `connectDB()` and `disconnectDB()` for explicit connection management
- Scripts wait for connection before running, disconnect cleanly on exit

### Data Models (`/models/`)
- **Launch.js** - References Rocket, Mission, Pad, Provider
- **Rocket.js**, **Mission.js**, **Pad.js**, **Provider.js** - Launch-related entities
- **Article.js** - News articles with optional launch/event links

### Pattern
All fetchers use upsert operations (`updateOne` with `{ upsert: true }`) for idempotent inserts.

## External APIs

- **Launch Library 2 (v2.2.0)** - `ll.thespacedevs.com` - 15 req/hour limit
- **Spaceflight News API (v4)** - `api.spaceflightnewsapi.net`

## Environment Setup

Requires `.env` file with:
- `DB_CONNECTION_STRING` - MongoDB Atlas connection string
- `LAUNCHES_LINK` - Launch Library 2 API endpoint
- `ARTICLES_LINK` - Spaceflight News API v4 endpoint

## Requirements

- Node.js 18+ (uses native fetch)
