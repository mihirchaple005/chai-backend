import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory 
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


// middleware import 

import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    // upload to multer
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

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


// specialy of users
router.route("/c/:userName").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

router.route("/new-video-upload").post(
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1,
        },
        {
            name : "thumbnail",
            maxCount : 1,
        }
    ])
)

export default router