import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllPosts, getPost, addPost, updatePost, deletePost } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", getAllPosts);
router.get("/:id", getPost);
router.post("/", verifyJWT, addPost);
router.put("/:id", verifyJWT, updatePost);
router.delete("/:id", verifyJWT, deletePost);

export default router;
