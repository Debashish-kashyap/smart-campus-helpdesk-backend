# Smart Campus Helpdesk – Backend

Backend service for Smart Campus Helpdesk built with Node.js and Express,
deployed on Google Cloud Run.

## Features
- PDF upload using Multer
- Text extraction from PDFs
- Google Cloud Storage integration
- Notice upload & retrieval system
- Notices accessible globally across all URLs
- REST APIs for admin authentication and documents
- Cloud Run compatible (PORT-based startup)

## Tech Stack
- Node.js (ES Modules)
- Express.js
- Multer
- pdf-parse
- Google Cloud Storage
- Google Cloud Run

## Environment Variables
⚠️ Note: Environment variables are required to run this project.
Secrets are managed securely via Cloud Run configuration.

```env
PORT=8080
BUCKET_NAME=your-gcs-bucket-name
ADMIN_PIN=your-admin-pin
