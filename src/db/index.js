import mongoose  from "mongoose";
import express from 'express';
import { DB_NAME } from "../constants.js";

const app = express()

const connetDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("Error After connecting : ERR -> ",error);
        })
        console.log(`MongoDB connect !! DB Host : ,${connectionInstance.connection.host}`)
        // app.listen(process.env.PORT, () => {
        //     console.log("App Listning At PORT : ",process.env.PORT)
        // })
    } catch (error) {
        console.log("Unable to connect DataBase : ERR -> ", error)
        process.exit(1)
    }
}

export default connetDB