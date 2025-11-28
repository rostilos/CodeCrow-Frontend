# CodeCrow Production Deployment Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Access to your backend API server
- (Optional) Docker for containerized deployment

## Step 1: Environment Configuration

Create a `.env` file for production settings:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Important**: Never commit `.env` files with sensitive data to version control.

## Step 2: Build the Application

```sh
# Install all dependencies
npm install

# Create optimized production build
npm run build
```

This creates a `dist/` folder with optimized static files ready for deployment.

## Step 3: Choose Your Deployment Method

### Method A: Docker Deployment (Recommended)

**Advantages**: Consistent environment, easy scaling, isolated dependencies

```sh
# Build Docker image
docker build -t codecrow-frontend:latest .

# Run container
docker run -d \
  --name codecrow-frontend \
  -p 8080:8080 \
  --restart unless-stopped \
  codecrow-frontend:latest

# Check logs
docker logs -f codecrow-frontend
```

**Using Docker Compose**:

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VITE_API_URL=https://api.yourdomain.com/api
    restart: unless-stopped
```

Deploy:
```sh
docker-compose up -d
```

### Method B: Nginx Deployment

**Advantages**: High performance, great for serving static files

1. **Build the application** (see Step 2)

2. **Install Nginx**:
   ```sh
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nginx
   ```

3. **Copy files to Nginx**:
   ```sh
   sudo cp -r dist/* /var/www/html/codecrow/
   ```

4. **Configure Nginx** (`/etc/nginx/sites-available/codecrow`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/html/codecrow;
       index index.html;

       # Handle client-side routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

5. **Enable site and restart**:
   ```sh
   sudo ln -s /etc/nginx/sites-available/codecrow /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Method C: Static Hosting Services

**Cloud Platforms** (zero configuration):

1. **Vercel**:
   ```sh
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**:
   ```sh
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **AWS S3 + CloudFront**:
   ```sh
   # Upload dist/ to S3 bucket
   aws s3 sync dist/ s3://your-bucket-name --delete
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

### Method D: Node.js Server

**Advantages**: Simple setup, good for small deployments

```sh
# Install serve globally
npm install -g serve

# Run in production mode
serve -s dist -l 8080

# Or using PM2 for process management
npm install -g pm2
pm2 serve dist 8080 --name codecrow-frontend --spa
pm2 save
pm2 startup
```

## Step 4: SSL/TLS Configuration

For production, always use HTTPS:

### Using Certbot (Let's Encrypt) with Nginx:

```sh
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

### Using Cloudflare:

1. Add your domain to Cloudflare
2. Update DNS to point to your server
3. Enable SSL/TLS in Cloudflare dashboard (Full or Full Strict mode)

## Step 5: Monitoring and Maintenance

### Health Checks

Create a simple health check endpoint or monitor the application:

```sh
# Check if app is running
curl http://localhost:8080

# Monitor with uptime services:
# - UptimeRobot
# - Pingdom
# - StatusCake
```

### Log Management

**Docker**:
```sh
docker logs -f codecrow-frontend
```

**Nginx**:
```sh
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**PM2**:
```sh
pm2 logs codecrow-frontend
```

### Update Deployment

```sh
# Pull latest code
git pull origin main

# Rebuild
npm install
npm run build

# Restart service (method depends on deployment):
# Docker:
docker restart codecrow-frontend

# Nginx:
sudo cp -r dist/* /var/www/html/codecrow/

# PM2:
pm2 restart codecrow-frontend
```

## Performance Optimization

### Enable Compression

All deployment methods should enable Gzip/Brotli compression for text assets.

### CDN Integration

Consider using a CDN for static assets:
- Cloudflare
- AWS CloudFront
- Google Cloud CDN
- Azure CDN

### Caching Strategy

```nginx
# In Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] API endpoint uses HTTPS
- [ ] Environment variables properly set
- [ ] No sensitive data in client-side code
- [ ] Regular dependency updates (`npm audit`)
- [ ] Firewall configured to allow only necessary ports

## Troubleshooting

### App not loading
- Check if the build was successful (`dist/` folder exists)
- Verify API URL in environment variables
- Check browser console for errors
- Ensure backend API is accessible

### 404 errors on refresh
- Configure server to redirect all routes to `index.html`
- For Nginx, use `try_files $uri $uri/ /index.html;`

### API connection issues
- Verify CORS settings on backend
- Check `VITE_API_URL` environment variable
- Test API endpoint manually with curl

## Support

For issues and questions, please refer to the project documentation or contact the development team.
