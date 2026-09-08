import express from 'express';
import { getConversationForSidebar, getMessage, getUserForSidebar, sendMessage } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get("/users", protectRoute, getUserForSidebar)
router.get("/conversations", protectRoute, getConversationForSidebar);
router.get("/:id", protectRoute, getMessage)
router.post("/send/:id", protectRoute, upload.single("media"), sendMessage);


export default router