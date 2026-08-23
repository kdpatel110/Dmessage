import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import { connectDB } from './lib/db.js'
import User from './models/user.model.js'
import { clerkMiddleware } from '@clerk/express'


const app = express()

const port = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  Credential: true,
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  connectDB();
  console.log(`Example app listening on port ${port}`)
})