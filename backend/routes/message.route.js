import express from "express";
import { addMessage } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:chatId", verifyJWT, addMessage);

export default router;
