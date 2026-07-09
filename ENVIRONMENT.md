# Environment Variables Configuration - PackOptima

Create a `.env` file in the root directory by copying `.env.example` and filling in the required credentials.

## Required Variables

- `MONGODB_URI`: The MongoDB Atlas connection string.
- `LOG_LEVEL`: Logs configuration (e.g. `debug`, `info`, `warn`).

## Future Phase Integration Variables

- `CLOUDINARY_CLOUD_NAME`: Cloudinary Cloud Name for storing images.
- `CLOUDINARY_API_KEY`: Cloudinary API Key.
- `CLOUDINARY_API_SECRET`: Cloudinary API Secret.
- `REMOVE_BG_API_KEY`: API key for background removal.
- `REDIS_URL`: BullMQ job worker redis endpoint (e.g. Upstash Redis).
