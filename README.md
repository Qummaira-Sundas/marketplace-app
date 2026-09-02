# Marketplace App

Clean structure:

```
react-todo-app/
├── client/          # React + Vite frontend
├── server/          # Express + MongoDB backend
├── README.md
└── .gitignore
```

## Setup

### 1. Backend
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:5000`

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`

## Features
- Auth (signup / login)
- Marketplace feed with search & sort
- Create / edit / delete listings
- Product detail page
- Favorites (heart)
- Hide / not interested / report on other users' posts
- My Listings

## Notes
- Stop any old `todo-app` node/vite processes before deleting leftover folders.
- If a locked `todo-app/` folder remains, close terminals running the old server/client, then delete it manually.
