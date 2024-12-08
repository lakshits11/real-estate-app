import express from "express";
import { loggedIn, shouldBeAdmin } from "../controllers/test.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/logged-in", verifyJWT,loggedIn);

router.get("/is-admin", shouldBeAdmin);

export default router;
