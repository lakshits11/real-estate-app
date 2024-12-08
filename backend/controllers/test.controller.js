import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const loggedIn = asyncHandler(async (req, res) => {
  
  // now since we are already using middleware to verify token, we dont need that below code here.
  // Also we are storing user details in req.user, so we can access them here
  console.log(req.user);
  

  return new ApiResponse(200, null, "You are Authenticated");
});

const shouldBeAdmin = asyncHandler(async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    throw new ApiError(401, "Not Authenticated!");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token is not Valid!",
      });
    }
    if (payload.isAdmin == false) {
      return res.status(403).json({
        success: false,
        message: "You are not Admin!",
      });
    }
  });

  return new ApiResponse(200, null, "You are Admin Authenticated!");
});

export { loggedIn, shouldBeAdmin };


/******* 
in logged-in function:

  auth.controller.js m login() function me:
  return res
    .cookie("accessToken", token, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, sanitizedUser, "Login successful"))
  
  Here we set cookie name as accessToken, so below also use
  req.cookies.accessToken, and not just req.cookies.token

  const token = req.cookies.accessToken;
  if (!token) {
    throw new ApiError(401, "Not Authenticated!");
  }

  Well a general question maybe is that why
  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if(err) {
      throw new ApiError(403, "Token is not Valid!");
    } 
  });

  will not work here?
  Reasons:
  1. jwt.verify uses a callback style approach, but we were throwing errors inside that callback
  2. When you throw an error inside a callback, it won't be caught by the outer try-catch or asyncHandler
    because the callback runs in a different execution context
  3. This caused unhandled promise rejections and crashed the app
  4. Also, we were trying to send a response after throwing an error, which can't work 
    because throw immediately stops the function execution

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token is not Valid!",
      });
    }
    // req.userId = payload.id;
  });

*/