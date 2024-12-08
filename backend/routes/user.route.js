import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  savePost,
  profilePosts
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllUsers);
// router.get("/:id", verifyJWT, getUser);
router.put("/:id", verifyJWT, updateUser);
router.delete("/:id", verifyJWT, deleteUser);

router.post("/savepost", verifyJWT, savePost);

router.get("/profilePosts", verifyJWT, profilePosts);

export default router;
