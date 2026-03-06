# Quick Setup — Fix Login Issues

## The Most Common Problem: "Login failed"

This happens when the React frontend can't reach the backend server.
Your React app is on port 5001, which means port 3000 was already in use.
The frontend needs to know where the backend is.

## Fix: Two terminals, two steps

### Step 1 — Start the backend (Terminal 1)
```
cd server
npm run dev
```
You should see:
  MongoDB connected
  SamarthaaEdu server running on port 5000

Verify it works: open http://localhost:5000/health in your browser.
You should see: {"status":"ok",...}

### Step 2 — Start the frontend with the API URL (Terminal 2)

**Windows CMD:**
```
cd client
set REACT_APP_API_URL=http://localhost:5000/api
npm start
```

**Windows PowerShell:**
```
cd client
$env:REACT_APP_API_URL="http://localhost:5000/api"
npm start
```

**Mac/Linux:**
```
cd client
REACT_APP_API_URL=http://localhost:5000/api npm start
```

### OR: Create a .env file in the client folder (easier)

Create a file called `.env` inside the `client/` folder with:
```
REACT_APP_API_URL=http://localhost:5000/api
```
Then just run `npm start` normally.

## Check your .env in server/
Make sure `server/.env` exists with at minimum:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/samarthaa
JWT_SECRET=any_long_random_string_here
ANTHROPIC_API_KEY=sk-ant-api03-...
NODE_ENV=development
```
