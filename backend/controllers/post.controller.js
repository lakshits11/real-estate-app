import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const getAllPosts = asyncHandler(async (req, res) => {
  const query = req.query;
  console.log(query);

  const post = await prisma.post.findMany({
    where: {
      city: query.city || undefined,
      type: query.type || undefined,
      property: query.property || undefined,
      bedroom: parseInt(query.bedroom) || undefined,
      price: {
        gte: parseInt(query.minPrice) || 0,
        lte: parseInt(query.maxPrice) || 2 ** 31 - 1,
      },
    },
  });

  if (!post) {
    throw new ApiError(404, "Could not fetch posts!");
  }

  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const savedPosts = await prisma.savedPost.findMany({
        where: {
          userId: payload.id,
        },
        select: {
          postId: true,
        },
      });
      post.forEach((item) => {
        item.isSaved = savedPosts.some((post) => post.postId === item.id);
      });
    } catch (err) {
      console.log("Token verification failed:", err);
    }
  }
  return res
    .status(200)
    .json(new ApiResponse(200, post, "Posts fetched successfully"));
});

const getPost = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      postdetails: true,
      user: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (!post) {
    throw new ApiError(404, "Post not found!");
  }

  let isSaved = false;
  const token = req.cookies?.accessToken;
  
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const savedStatus = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId: payload.id,
            postId: id,
          },
        },
      });
      isSaved = !!savedStatus;
    } catch (err) {
      console.log("Token verification failed:", err);
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...post, isSaved },
        "Post fetched successfully"
      )
    );
});

const addPost = asyncHandler(async (req, res) => {
  const body = req.body;
  const tokenUserId = req.user.id;

  const newPost = await prisma.post.create({
    data: {
      ...body.postdata,
      userId: tokenUserId,
      postdetails: {
        create: body.postdetails,
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newPost, "Post added successfully"));
});

const updatePost = asyncHandler(async (req, res) => {});

const deletePost = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.user.id;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw new ApiError(404, "Post not found!");
  }
  if (post.userId !== tokenUserId) {
    throw new ApiError(403, "Not authorized to delete this post");
  }

  await prisma.post.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

export { getAllPosts, getPost, addPost, updatePost, deletePost };
