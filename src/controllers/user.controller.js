import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const generareAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generareRefreshToken()
        // refresh token ko database me bhi dalke rakhna hai taki bar bar user se password na puchna pade
        // how to store refresh token in database do as below

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
    }
}

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
    const {fullName , email, userName, password} = req.body
    // console.log("email : ", email);

// validation

    // if (fullName === "") {
    //     throw new ApiError(400, "Full name is required")
    // }   usual method

    if (
        [fullName , email, userName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //  to find already or not

    const existedUser = await User.findOne({
        $or : [{ userName }, { email }]
    })

    // models he mongodb ko apne behalf pe call krta hai and db me data save krta hai 

    if (existedUser) {
        throw new ApiError(409, "User with same email or Username exists ")
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path  // .coverImage[0]?.path ho sakta hai yaa nahi bhi ki first property me path ho

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // console.log(req.files)

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

const loginUser = asyncHandler( async (req, res) => {
    // Todos for login user
    /*
    1) user name entry  i.e. data lana [req-> body se data lao]
    2) check the user is registered or not
    3) if not send message to register the user
    4) if yes check for refresh token the username possesses 
    5) if refresh token match give new access token 
    6) if not match then ask the user for the password to login
     */

    /*
    * take data from req->body
    * username or email
    * find the user
    * password check
    * give access and refresh token 
    * send cookie */

    const {userName, email, password} = req.body

    if(!userName && !email ) {
        throw new ApiError(400, "username or email is required")
    }

    // below we are writing is a query
    // and we write query to fetch data from the database

    const user  = await User.findOne({
        $or : [{userName}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "user not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    console.log(user._id)

    const {accessToken, refreshToken} = await generareAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // for security perpose after options the cookies will be modified only through server
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.
    status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "user logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out successfully"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired is used")
        }
    
    // saab verification ho chuka hai user same hi hai kyuki iss line of code the taab hi pohucha ja sakta hai kaab user ke browser and database ka refresh token match krr gaya ho
    
    // tho jaab sara veification ho chuka hai tho new token generate krke user and database me store krr do
    
        // abb cookies me send krnahai tho options rakhne hi padte hai
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generareAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}

