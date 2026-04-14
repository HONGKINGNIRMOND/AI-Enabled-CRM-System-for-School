# Railway Deployment Guide

This guide will walk you through deploying the School Management CRM System to [Railway.app](https://railway.app/).

## Prerequisites
1.  A Railway account connected to your GitHub.
2.  Your project pushed to a GitHub repository.

---

## Step 1: Create a New Project
1.  Go to the [Railway Dashboard](https://railway.app/dashboard).
2.  Click **+ New Project**.
3.  Choose **Deploy from GitHub repo** and select your repository.

---

## Step 2: Add a PostgreSQL Database
1.  In your new project, click **+ Add Service**.
2.  Select **Database** -> **Add PostgreSQL**.
3.  Once created, click on the PostgreSQL service, go to the **Variables** tab, and copy the `DATABASE_URL`. (Though Railway will allow us to reference it directly later).

---

## Step 3: Configure the Backend Service
Since this is a monorepo, we need to tell Railway where the backend is.

1.  In your project dashboard, click on the service created from your repo.
2.  Go to the **Settings** tab.
3.  Find the **General** section and set:
    *   **Service Name**: `backend`
    *   **Root Directory**: `backend`
4.  Go to the **Variables** tab and add the following:
    *   `PORT`: `3001` (or leave empty, Railway defaults to 8080)
    *   `NODE_ENV`: `production`
    *   `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Select from the reference list)
    *   `JWT_SECRET`: `your_random_secret_here`
    *   `FRONTEND_URL`: `${{frontend.RAILWAY_PUBLIC_DOMAIN}}` (We will set this up after creating the frontend service).
    *   `DB_POOL_MAX`: `20`
5.  Railway will automatically detect the `package.json` and run `npm start`.

---

## Step 4: Configure the Frontend Service
1.  Click **+ Add Service** -> **Deploy from GitHub repo** again.
2.  Select the same repository.
3.  Go to the **Settings** tab of this new service:
    *   **Service Name**: `frontend`
    *   **Root Directory**: `frontend`
4.  Go to the **Variables** tab and add:
    *   `VITE_API_URL`: `${{backend.RAILWAY_PUBLIC_DOMAIN}}` (Reference the backend service domain)
5.  Railway will detect Vite and run `npm run build`.

---

## Step 5: Database Setup (First Time Only)
After both services are running, you need to initialize the database schema and seeds.

1.  Open your local terminal.
2.  Ensure you have the Railway CLI installed (`npm i -g @railway/cli`).
3.  Login: `railway login`.
4.  Link your project: `railway link`.
5.  Run the migrations and seeds remotely:
    ```bash
    cd backend
    railway run npm run setup
    ```
    *Alternatively, you can go to the Railway Dashboard, open the Backend service, click **View Logs**, and use the **Deployment Shell** (if available) or simply add `npm run migrate` to your start script temporarily.*

---

## Step 6: Verify
1.  Go to the **Networking** tab of your `frontend` service.
2.  Click **Generate Domain** if one doesn't exist.
3.  Open the domain in your browser.
4.  You should see the CRM login page!

---

> [!TIP]
> **Domain Troubleshooting**: If you get CORS errors, double-check that the `FRONTEND_URL` in the backend variables exactly matches your frontend's Railway domain (including `https://`).

> [!IMPORTANT]
> **Environment Variables**: Railway variables are case-sensitive. Ensure they match exactly what is used in the `backend/config/database.js` and `frontend/src/config.js` (if applicable).
