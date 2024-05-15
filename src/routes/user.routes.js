import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

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

export default router