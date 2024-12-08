import bcryptjs from "bcryptjs";
import prisma from "../lib/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

/*
STEPS TO REGISTER USER
1. deconstruct req.body
2. hash password
3. create a new user while doing some validations
  - validations
    - username should be unique (ie. should not already exist)
    - email should be unique
    - valid email, password, username format
4. send response
*/
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  // Create sanitized user object without password and sensitive data
  const sanitizedUser = {
    username: user.username,
    email: user.email,
  };

  // Return ApiResponse instance - asyncHandler will handle the formatting
  return new ApiResponse(201, sanitizedUser, "User registered successfully");
});

/*
STEPS TO LOGIN USER
1. deconstruct req.body
2. check if user exists
3. check if password is correct
4. generate cookie token and send to user
*/
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate cookie token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      isAdmin: true
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );

  const sanitizedUser = {
    name: user.name,
    avatar: user.avatar,
    username: user.username,
    email: user.email,
    id: user.id
  };

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  // Set cookie and send the formatted response
  return res
    .cookie("accessToken", token, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, sanitizedUser, "Login successful"));
});

/* 
STEPS TO LOGOUT USER
1. check if user is authenticated
2. clear cookie
3. send response
*/

const logout = asyncHandler(async (req, res) => {
  // User is already verified by verifyJWT middleware
  return res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json(new ApiResponse(200, null, "Logout successful"));
});

export { registerUser, login, logout };
