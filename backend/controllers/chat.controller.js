import prisma from "../lib/prisma.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const chats = await prisma.chat.findMany({
    where: {
      userIds: {
        hasSome: [userId],
      },
    },
    include: {
      Message: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  for (const chat of chats) {
    const receiverId = chat.userIds.find((id) => id !== userId);
    if (!receiverId) {
      continue;
    }
    const receiver = await prisma.user.findUnique({
      where: {
        id: receiverId,
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });
    chat.receiver = receiver;
  }
  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});

/*
See notes.md for why we use this raw query
*/
const getChat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const chatId = req.params.id;

  // First update seenBy using $addToSet to prevent duplicates
  await prisma.$runCommandRaw({
    update: "Chat",
    updates: [
      {
        q: { _id: { $oid: chatId } },
        u: { $addToSet: { seenBy: userId } },
      },
    ],
  });

  // Then fetch the updated chat with messages and user details
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      Message: {
        orderBy: {
          createdAt: "asc",
        },
      },
      users: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat fetched successfully"));
});

const addChat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const receiverId = req.body.receiverId;

  if (!receiverId) {
    throw new ApiError(400, "Receiver id is required");
  }

  if (userId === receiverId) {
    throw new ApiError(400, "Cannot create chat with yourself");
  }

  const newChat = await prisma.chat.create({
    data: {
      users: {
        connect: [{ id: userId }, { id: receiverId }],
      },
      userIds: [userId, receiverId],
      seenBy: [userId],
    },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(200, newChat, "Chat created successfully"));
});

const readChat = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // First get the chat to check current seenBy array
  const chat = await prisma.chat.findFirst({
    where: {
      id: req.params.id,
      userIds: {
        hasSome: [userId],
      },
    },
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  // Only update if userId is not already in seenBy
  if (!chat.seenBy.some((id) => id.toString() === userId.toString())) {
    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      data: {
        seenBy: {
          push: userId,
          // set: [...chat.seenBy, userId]
        },
      },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat read successfully"));
});
export { addChat, getChat, getChats, readChat };
