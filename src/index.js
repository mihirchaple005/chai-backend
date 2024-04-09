import dotenv from 'dotenv'
import connetDB from './db/index.js';

dotenv.config({
    path : './env'
})

connetDB()


































// older approach

// function connectDb() {
    
// }

// connectDb();

//  More optimised approach through making fes..

/*
import express from 'express'
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror",(error) => {
            console.log("Not Able to takl with database -> Error : ",error)
            throw err
        })

        app.listen(process.env.PORT, () => {
            console.log("Listening at port : ",`${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error : ",error)
        throw err
    }
})()
*/