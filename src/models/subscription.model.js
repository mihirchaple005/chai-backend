import mongoose, { Schema } from "mongoose";

const subscriptionScheme = new Schema({
    subscriber : {
        type : Schema.type.ObjectId, // one who is subscribing
        ref : "User" 
    },
    channel : {
        type : Schema.type.ObjectId, // one to whom subscriber is subscribing
        ref : "User"
    }
},{timestamps : true})

export const Subscription = mongoose.model("Subscription" ,subscriptionScheme)