import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";



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

const changeCurrentPassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)  //yee id
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400 , "Invalid old password")
    }

    this.password = newPassword  // this is to set the password here it not saved yet in the database
    await user.save({validateBeforeSave : false}) // here the hashed password is saved in the database and haa jaab save method call hoga tabhi vho pre dave wala hook run hoga jho user model me likha hai

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
    // user = await User.findById(req.user?._id)
    
})


// production level code trick : koi file vagera update krwani hai user se tho uska controller alag se likhna most of the production level code me log aisa hi krte hai

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, //yee id
        {
            $set : {
                fullName,  // fullName : fullName aisa bhi kiya tho chalenga
                email : email
            }
        },
        {
            new : true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully")) //yee data api ke through jata hai frontend ke pass

})



// writing seperste controllers for updation in file kind of things
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url)  {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        { new : true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url)  {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        { new : true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {userName} = req.params
    if (!userName?.trim()) {
        throw new ApiError('400',"User Name is missing")
    }

    // writing mogodb aggregation pipelines

    const channel = await User.aggregate([
        {
            $match : userName?.toLowerCase()
        },
        {
            $lookup : {
                from : subscriptions, // hamne code me naam Subscription diya hai but mogodb me as subscriptions reflect hoga
                localField : "_id",
                foreignField : "channel",
                as : "suscribers"  // iaa naam se dikenga yee jaab attach ho jayega basicaaly varible name dere data ko jo haam aggregated pipeline se laa rahe hai
            }
        },
         {
            $lookup : {
                from : subscriptions,
                localField : "_id",
                foreignField : "subscriber",
                as : "suscribedTo"
            }  
         },
         {
            $addFields : {
                subscribersCount : {
                    $size : "$suscribers"
                },
                channelSubscribedToCount : {
                    $size : "$suscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id, "subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                 }
            }
         },
         {
            $project : {
                fullName : 1,
                userName : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                coverImage : 1,
                avatar : 1,
                email : 1
            }
         }
         
    ])

    //  aase time prr jaab pata na ho ki value konsi aa rahi hai console log krr dena jaise iss case ne channel hai upper wala
    // console.log(channel)

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async (req, res) => {
    // req.user._id yee string deta hai object id ke andar ki and yee sabb convertion ka kam krta hai mongoose
    // prr agrregation me data directly hi pass hota hai iseleye hame object id thorough mongoose banani padengi

    const user = await User.aggregate([
        {
            $match : {
                // _id : req.user._id yee  nahi krr sakte due to above resons
                _id : new mongoose.Types.ObjectId(req.user._id)

            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        avatar : 1,
                                        userName : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].getWatchHistory,
            "watch History fetched successfully "
        )
    )

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

