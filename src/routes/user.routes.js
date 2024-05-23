import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// middleware import 

import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    // upload to cloudinary
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout",).post(verifyJWT, logoutUser)
router.route("/refresh-token",).post(refreshAccessToken)  // creation of endpoint

export default router