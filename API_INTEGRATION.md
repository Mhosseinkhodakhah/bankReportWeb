# API Integration Documentation

This document describes the API integration for the PWA Uploader application.

## API Base URL

- **Production**: `https://analyz.khanetalaa.ir`

## Authentication

### Login

- **Endpoint**: `POST /auth/login`
- **Parameters**:
  - `phoneNumber` (string): User's phone number
  - `password` (string): User's password
- **Response**:
  ```json
  {
    "success": true,
    "message": "ورود موفقیت آمیز",
    "data": {
      "firstName": "admin",
      "lastName": "admin",
      "phoneNumber": "09123456789",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "timestamp": "2025-08-31 12:42:40"
  }
  ```

### Logout

- **Endpoint**: `POST /auth/logout`
- **Headers**: Requires authentication token

## File Upload

### User Excel Upload

- **Endpoint**: `POST /uploads/userExcels`
- **Parameters**:
  - `files` (FormData): Excel files to upload
  - `version` (query parameter): Version number for the upload
- **Headers**: Requires authentication token

### Admin Excel Upload

- **Endpoint**: `POST /uploads/adminExcels`
- **Parameters**:
  - `files` (FormData): Excel files to upload
  - `version` (query parameter): Version number for the upload
- **Headers**: Requires authentication token

### Process Files

- **Endpoint**: `POST /uploads/processFiles`
- **Body**:
  ```json
  {
    "version": "string"
  }
  ```
- **Headers**: Requires authentication token

### Get File by ID

- **Endpoint**: `GET /uploads/file/{id}`
- **Parameters**:
  - `id` (path parameter): File ID
- **Headers**: Requires authentication token

## Version Management

The application automatically manages version numbers for uploads:

- Each new upload increments the version number
- Versions are stored locally in localStorage
- Version format: "1", "2", "3", etc.

## Error Handling

The application includes comprehensive error handling:

- Network errors are logged to console
- Authentication errors (401) automatically redirect to login
- Upload errors show user-friendly messages
- Proper error handling for production use

## Production Features

- **Real API Integration**: All endpoints connect to the production API
- **Authentication**: Uses real authentication with valid credentials
- **Version Management**: Server-side version tracking
- **Error Handling**: Proper error handling for production use

## Usage Examples

### Login

```typescript
import { login } from "./api/authService";

const response = await login({
  phoneNumber: "09123456789",
  password: "password123",
});
```

### Upload Files

```typescript
import { uploadUserExcels } from "./api/uploadService";

const files = [file1, file2]; // File objects
const response = await uploadUserExcels(files);
```

### Process Files

```typescript
import { processFiles } from "./api/uploadService";

const result = await processFiles("1");
console.log(result.message);
```

## Configuration

The API configuration is centralized in `src/api/config.ts`:

- Base URL configuration
- Request/response interceptors
- Authentication token management
- Error handling
- Endpoint definitions
