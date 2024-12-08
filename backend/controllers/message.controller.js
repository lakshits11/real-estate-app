import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const chatId = req.params.chatId;
  const text = req.body.text;

  // first check if this chat belongs to us or not
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
      userIds: {
        hasSome: [userId],
      },
    },
  });

  if (!chat) {
    throw new ApiError(403, "Chat does not belong to you");
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      text,
    },
  });

  // Update chat with new message and seenBy
  await prisma.chat.update({
    where: {
      id: chatId
    },
    data: {
      lastMessage: text,
      seenBy: {
        set: chat.seenBy.some(id => id.toString() === userId.toString()) 
            ? chat.seenBy 
            : [...chat.seenBy, userId]
      }
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message sent successfully"));
});
