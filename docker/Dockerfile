# Dockerfile for frontend_leema (static HTML/JS site)

FROM nginx:alpine

# Copy all static files to nginx html directory
COPY public /usr/share/nginx/html/public
COPY shop /usr/share/nginx/html/shop
COPY user /usr/share/nginx/html/user
COPY admin /usr/share/nginx/html/admin
COPY assets /usr/share/nginx/html/assets

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
