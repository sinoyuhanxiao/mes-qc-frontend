FROM nginx:alpine

# Copy production build files
COPY dist/ /usr/share/nginx/html

# Copy custom NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default NGINX port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
