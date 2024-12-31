# Use Nginx to serve static files
FROM nginx:alpine
# Copy production build files from dist/
COPY dist/ /usr/share/nginx/html
# Expose the default Nginx port
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
