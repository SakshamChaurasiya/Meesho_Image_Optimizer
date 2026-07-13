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

### 2. Image Processing Pipeline (`/api/process`)

#### `POST`
- **Description**: Trigger variant generation and image analysis for a given `imageId`.
- **Request Body**:
  ```json
  {
    "imageId": "64b123..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "imageId": "64b123...",
    "status": "completed",
    "backgroundProvider": "imgly",
    "fallbackUsed": false,
    "variantCount": 24,
    "variants": [
      {
        "variantId": "variant_1_white_pad10_webp",
        "url": "https://res.cloudinary.com/...",
        "format": "webp",
        "size": 34820,
        "score": 95,
        "transformations": {
          "backgroundRemoved": true,
          "objectCentered": true,
          "paddingApplied": 10,
          "brightnessAdjusted": 1.0,
          "contrastAdjusted": 1.0,
          "compressed": true
        }
      }
    ]
  }
  ```

#### `GET`
- **Description**: Query the processing status of a specific image document.
- **Query Parameters**: `?imageId=64b123...`
- **Response**:
  ```json
  {
    "imageId": "64b123...",
    "status": "completed",
    "variantCount": 24,
    "errorDetails": null
  }
  ```

### 3. Processing Results (`/api/results/[imageId]`)

#### `GET`
- **Description**: Fetch the complete image document metadata including all generated variants and the analysis payload.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "64b123...",
      "fileName": "tshirt.png",
      "originalUrl": "https://res.cloudinary.com/...",
      "status": "completed",
      "backgroundProvider": "imgly",
      "fallbackUsed": false,
      "analysis": {
        "dimensions": { "width": 800, "height": 800 },
        "boundingBox": { "left": 100, "top": 50, "width": 600, "height": 700 },
        "occupancyRatio": 0.65,
        "whiteSpaceRatio": 0.35,
        "centerAlignment": { "dx": 2, "dy": -3, "isCentered": true },
        "brightness": 142.5,
        "contrast": 68.2,
        "resolution": 640000,
        "aspectRatio": 1.0
      },
      "variants": [...]
    }
  }
  ```
