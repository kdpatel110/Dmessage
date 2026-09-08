import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { connectDB } from './lib/db.js'
import User from './models/user.model.js'
import { clerkMiddleware } from '@clerk/express'
import fs from 'fs';
import path from 'path';
import job from './lib/cron.js'
import clerkWebhook from './webhooks/clerk.webhook.js'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'

const app = express()

const port = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL

const publicDir = path.join(process.cwd(), "public");

// it's important that you don't parse the webhook event data, it should be in the raw format
app.use("/api/webhooks/clerk",express.raw({type: "application/json"}), clerkWebhook);

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  Credential: true,
}));
app.use(clerkMiddleware());

app.get("/health", (req, res)=>{
  res.status(200).json({ok: true});
})

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)

if(fs.existsSync(publicDir)){
  app.use(express.static(publicDir))

  app.get("/{*any}", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  })
}

app.listen(port, () => {
  connectDB();
  console.log(`Example app listening on port ${port}`)

  if(process.env.NODE_ENV === "production"){
     job.start()
    }
})
