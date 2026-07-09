# API Documentation - PackOptima

All route handlers return JSON responses following this standard structure:

```json
{
  "success": true,
  "data": {}
}
```

Or for errors:

```json
{
  "success": false,
  "error": "Error message details",
  "details": {}
}
```

## Route Endpoints

### 1. File Upload Handler (`/api/upload`)

#### `POST`
- **Description**: Upload a new product image.
- **Request Format**: `multipart/form-data`
  - Field: `file` (Binary payload, JPEG/PNG/WEBP, size <= 10MB)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "64b123...",
      "fileName": "tshirt.png",
      "originalUrl": "https://res.cloudinary.com/...",
      "originalPublicId": "packoptima/...",
      "width": 800,
      "height": 800,
      "size": 154300,
      "format": "png",
      "status": "pending",
      "variants": [],
      "createdAt": "2026-07-09T...",
      "updatedAt": "2026-07-09T..."
    }
  }
  ```

#### `GET`
- **Description**: Fetch the 12 most recently uploaded product images.
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "64b123...",
        "fileName": "tshirt.png",
        "originalUrl": "https://res.cloudinary.com/...",
        "status": "pending",
        ...
      }
    ]
  }
  ```
