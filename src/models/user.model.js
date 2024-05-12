import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        userName : {
            type : String,
            unique : true,
            required : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            unique : true,
            required : true,
            lowercase : true,
            trim : true,
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String,      //cloudinary url
            required : true
        },
        coverImage : {
            type : String,
        },
        watchHistory : [ {
            type : Schema.Types.ObjectId,
            ref : 'Video'
        }],
        password : {
            type : String,
            required : [true,'Passsword is required']
        },
        refreshToken : {
            type : String
        }
    },
    {
        timeStamps : true
    }
)

// assync jaga jaha prr hai waha waha prr time lagta hai
// paaword encrption logic
userSchema.pre("save",async function (next) {
    if (!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


// referesh token me jyada information nahi hoti hai our yee bar bar generate bhi hota hai 
userSchema.methods.generareRefresh.Token = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)