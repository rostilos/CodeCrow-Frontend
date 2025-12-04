# CodeCrow - AI-Powered Code Review Platform

## Project Overview

CodeCrow is a professional AI-powered code review platform for developers and teams. It provides automated code analysis, issue detection, and comprehensive project statistics.

## Technology Stack

This project is built with:
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - UI component library

## Development Setup

### Prerequisites

- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git for version control

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8081/api
```

For production, update `VITE_API_URL` to your production API endpoint.

## Production Deployment

### Build for Production

```sh
# Install dependencies
npm install

# Create production build
npm run build
```

This generates optimized static files in the `dist/` directory.

### Deployment Options

#### Option 1: Docker Deployment (Recommended)

```sh
# Build the Docker image
docker build -t codecrow-frontend .

# Run the container
docker run -p 8080:8080 codecrow-frontend
```

#### Option 2: Static File Hosting

Deploy the `dist/` folder to any static hosting service:
- **Nginx**: Copy `dist/` contents to `/var/www/html`
- **Apache**: Copy `dist/` contents to document root
- **Cloud providers**: AWS S3, Google Cloud Storage, Azure Static Web Apps
- **CDN platforms**: Cloudflare Pages, Vercel, Netlify

#### Option 3: Node.js Server

```sh
# Install a static file server
npm install -g serve

# Serve the production build
serve -s dist -l 8080
```

### Production Configuration

1. **Environment Variables**: Set production API URL in `.env`:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```

2. **Build the application**:
   ```sh
   npm run build
   ```

3. **Deploy** the `dist/` folder to your hosting platform

### Backend API

The frontend requires a backend API server. Configure the API endpoint using the `VITE_API_URL` environment variable.

Default development API: `http://localhost:8081/api`

### Backend Email/SMTP Configuration

For features like Two-Factor Authentication (2FA) via email, the backend server requires SMTP configuration. Add these properties to your backend `application.properties`:

```properties
# Enable email
codecrow.email.enabled=true
codecrow.email.from=noreply@yourdomain.com
codecrow.email.from-name=CodeCrow

# SMTP Configuration (Gmail example)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

> **📖 For detailed SMTP setup with different providers (Amazon SES, SendGrid, Mailgun), see the [SMTP Setup Guide](../docs/SMTP_SETUP.md)**

## Project Structure

```
codecrow-web-frontend/
├── src/
│   ├── api_service/       # API service layer
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── config/           # Configuration files
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility libraries
├── public/               # Static assets
├── dist/                 # Production build output
└── Dockerfile           # Docker configuration
```

## Docker Support

### Development with Docker

```sh
docker build -t codecrow-frontend .
docker run -p 8080:8080 -v $(pwd):/app codecrow-frontend
```

### Production with Docker

The included `Dockerfile` is production-ready and includes:
- Security hardening (non-root user)
- Optimized layer caching
- Health checks
- Minimal image size

## License

Copyright © 2025 CodeCrow. All rights reserved.
