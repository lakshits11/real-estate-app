import express from "express";
import {
  addChat,
  getChat,
  getChats,
  readChat,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getChats);
router.get("/:id", verifyJWT, getChat);
router.post("/", verifyJWT, addChat);
router.put("/read/:id", verifyJWT, readChat);

export default router;
