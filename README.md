# apex-scoring-broadcast
Source that powers overstat.gg

# Development Setup

## Requirements
- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.JS & NPM](https://nodejs.org/en/download)

## Instructions
### 1. Fork the repository
https://github.com/Double0negative/apex-scoring-broadcast/fork
### 2. Clone the repository locally
```bash
git clone git@github.com:YOUR_USERNAME/apex-scoring-broadcast.git
```
### 3. Start the databases
```bash
cd apex-scoring-broadcast
docker compose -f docker-compose-dev.yml up -d
```
### 4. Start the backend
In the same terminal from step 3:
```bash
cd server
npm install
npm start
```
### 5. Start the frontend
In a new terminal:
```bash
cd apex-scoring-broadcast/frontend
npm install
npm run serve
```
### 6. Create an admin user
```bash
curl -L 'http://localhost:3000/auth/create' -H 'x-admin-key: key' -F 'username="admin"'
```
Copy the value from "key" in the response body. Store it somewhere safe.

--

**You're ready to start contributing!**

Visit http://localhost:8080 to view the site. To log in to the Tournament Manager, use the Username "admin" with the key from step 6 above.