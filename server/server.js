import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { connectDB } from './lib/db.js'
import User from './models/user.model.js'
import { clerkMiddleware } from '@clerk/express'
import fs from 'fs';
import path from 'path';


const app = express()

const port = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL

const publicDir = path.join(process.cwd(), "public");

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  Credential: true,
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

if(fs.existsSync(publicDir)){
  app.use(express.static(publicDir))

  app.get("/{*any}", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  })
}

app.listen(port, () => {
  connectDB();
  console.log(`Example app listening on port ${port}`)
})