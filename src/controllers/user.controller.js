import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation --> not empty
    // check if user already exists  .. - with username and email 
    // check for images check for avatar -- check is it done properly using mutler or not
    // upload them to cloudinary, avatar -- weather the images are going properly to cloudinary or not..
    // create user objects - create entry in database
    // remove password and refresh token from response
    //  check for the user creation 

    //  note ** yaha prr sirf data related chizo se deal hogi , png, imahes wagere se deal krna hai tho middleware multer ka use "routes" me krna padenga me krna padta hai

// 1st step
    const {fullName , email, userName, passeord} = req.body
    console.log("email : ", email);

// validation

    // if (fullName === "") {
    //     throw new ApiError(400, "Full name is required")
    // }   usual method

    if (
        [fullName , email, userName, passeord].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //  to find already or not

    const existedUser = User.findOne({
        $or : [{ userName }, { email }]
    })

    // models he mongodb ko apne behalf pe call krta hai and db me data save krta hai 

    if (existedUser) {
        throw new ApiError(409, "User with same email or Username exists ")
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path  // .coverImage[0]?.path ho sakta hai yaa nahi bhi ki first property me path ho

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url, // apne ko database me object save nahi krna hai balki uss object ki cloudinary wali link store krke rakhni hai jho cloudinary ke response se hame milengi
        coverImage : coverImage?.url || "",
        email,
        password,
        userName : userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User ragistered successfully")
    )

})

export {
    registerUser
}

