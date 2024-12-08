import bcryptjs from "bcryptjs";
import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { json } from "express";
import { create } from "domain";

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new ApiError(404, `User with id ${req.params.id} not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, `User fetched successfully`));
});

/*
updateuser is a much more complex function because
4. Check if the user is authorized to update this user(only self can update)
3. Has to validate which fields are actually being updated
5. Check if the new username/email already exists(more complicated)
1. it also needs to generate a new token if the username is updated
2. Also the user info in localstorage needs to be updated
*/
const updateUser = asyncHandler(async (req, res) => {
  const idToUpdate = req.params.id;
  const { username, email, password, avatar } = req.body;

  console.log("idToUpdate: ", idToUpdate);
  console.log("current req.user.id: ", req.user.id);

  // 1. Authorization Check
  if (idToUpdate !== req.user.id) {
    throw new ApiError(403, "Not authorized to update this user");
  }

  // 2. user id which need to be updated should exist in db
  const currentUser = await prisma.user.findUnique({
    where: { id: idToUpdate },
  });

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // 3. Prepare Update Data
  const updateData = {};

  // 4. Validate and Process Username
  if (username?.trim()) {
    const trimmedUsername = username.trim();
    if (trimmedUsername !== currentUser.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
      if (existingUsername) {
        throw new ApiError(400, "Username already taken");
      }
      updateData.username = trimmedUsername;
    }
  }

  // 5. Validate and Process Email
  if (email?.trim()) {
    const trimmedEmail = email.trim();
    if (trimmedEmail !== currentUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingEmail) {
        throw new ApiError(400, "Email already registered");
      }
      updateData.email = trimmedEmail;
    }
  }

  // 6. Process Avatar
  if (avatar) {
    updateData.avatar = avatar;
  }

  // 7. Process Password
  if (password) {
    const isPasswordSame = await bcryptjs.compare(
      password,
      currentUser.password
    );
    if (!isPasswordSame) {
      updateData.password = await bcryptjs.hash(password, 10);
    }
  }

  // 8. Check if there are any updates
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No changes to update");
  }

  // 9. Perform Update
  const updatedUser = await prisma.user.update({
    where: { id: idToUpdate },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });

  // 10. Generate new token if username was updated
  let newToken;
  if (updateData.username) {
    newToken = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        // isAdmin: true,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
  }

  // Set cookie and send the formatted response
  // 11. Send Response with Cookies
  if (newToken) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
    res.cookie("accessToken", newToken, cookieOptions);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Update User data successful"));
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this user");
  }

  const deletedUser = await prisma.user.delete({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, deletedUser, "User deleted successfully"));
});

const savePost = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const savedPost = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId: userId,
        postId: postId,
      },
    },
  });

  // if (savedPost) {
  //   // If post is already saved, unsave it
  //   await prisma.savedPost.delete({
  //     where: {
  //       id: savedPost.id,
  //     },
  //   });
  //   return res
  //     .status(200)
  //     .json(new ApiResponse(200, null, "Post unsaved successfully"));
  // }

  if (savedPost) {
    await prisma.$transaction(async (tx) => {
      await tx.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Post unsaved successfully"));
  }

  // // If post is not saved, save it
  // const newSavedPost = await prisma.savedPost.create({
  //   data: {
  //     userId: userId,
  //     postId: postId,
  //   },
  // });

  const newSavedPost = await prisma.$transaction(async (tx) => {
    return await tx.savedPost.create({
      data: {
        userId,
        postId,
      },
    });
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newSavedPost, "Post saved successfully"));
});

const profilePosts = asyncHandler(async (req, res) => {
  const userId = req.user.id; // This is correct because verifyJWT middleware sets req.user
  const userSavedPosts = await prisma.savedPost.findMany({
    where: {
      userId: userId,
    },
    include: {
      post: true,
    },
  });

  const savedPosts = userSavedPosts.map((item) => ({
    ...item.post,
    isSaved: true,
  }));
  console.log(savedPosts);

  const userAllPosts = await prisma.post.findMany({
    where: {
      userId: userId,
    },
  });

  const userAllPostsWithSaved = userAllPosts.map((post) => ({
    ...post,
    isSaved: savedPosts.some((savedPost) => savedPost.id === post.id),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      { userAllPosts: userAllPostsWithSaved, savedPosts },
      "Profile posts fetched successfully"
    )
  );
});

export { getAllUsers, getUser, deleteUser, updateUser, savePost, profilePosts };
