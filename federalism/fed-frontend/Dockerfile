FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Expose the dev server port
EXPOSE 5173

# Allow the dev server to accept connections from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]