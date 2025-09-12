FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force
RUN npm install

# Copy source files (excluding node_modules)
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./

EXPOSE 5173

CMD ["npm", "run", "dev"]