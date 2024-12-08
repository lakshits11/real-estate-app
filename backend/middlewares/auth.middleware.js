import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import prisma from "../lib/prisma.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
           
        // Verify user exists in database
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.id },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true
                // Excluding password and other sensitive fields
            }
        });

        if (!user) {
            throw new ApiError(401, "Invalid access token - User not found");
        }

        req.user = user; // Attach verified user data to request
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
