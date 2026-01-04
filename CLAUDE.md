# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ground Control Fetcher is a Node.js utility that fetches space launch and news article data from external APIs and stores it in MongoDB Atlas. It's a one-time sync utility, not a persistent server.

## Commands

- `npm start` - Run the launch data fetcher (`node fetch-launches.js`)
- `npm run dev` - Run with nodemon for development (auto-reload on changes)

Note: Scripts execute once and exit via `process.exit(0)` after completion.

## Architecture

### Entry Points
- **fetch-launches.js** - Main script that fetches upcoming space launches from The Space Devs API (ll.thespacedevs.com) and upserts data across 5 related models
- **fetch-articles.js** - Alternative script for fetching space news articles

### Data Models (`/models/`)
All models use Mongoose schemas with MongoDB Atlas:
- **Launch.js** - Space launch events (references Rocket, Mission, Pad, Provider)
- **Rocket.js** - Launch vehicles
- **Mission.js** - Mission metadata (optional in launches)
- **Pad.js** - Launch pad/facility locations
- **Provider.js** - Launch service providers
- **Article.js** - Space news articles

### Database Pattern
- Uses upsert operations (`updateOne({_id}, data, {upsert: true})`) for idempotent inserts
- Related entities are upserted before the main Launch document
- Connection established in `db_connection.js` using environment variables

## External APIs

- **Launch Library 2 (v2.2.0)** - `ll.thespacedevs.com` - Space launch data (15 req/hour limit)
- **Spaceflight News API (v4)** - `api.spaceflightnewsapi.net` - Space news articles

## Environment Setup

Requires `.env` file with:
- `DB_CONNECTION_STRING` - MongoDB Atlas connection string
- `LAUNCHES_LINK` - Launch Library 2 API endpoint
- `ARTICLES_LINK` - Spaceflight News API v4 endpoint
