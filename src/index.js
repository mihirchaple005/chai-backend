import dotenv from 'dotenv'
import connetDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path : './env'
})

connetDB()
.then(() => { 
    app.listen(process.env.PORT,() => {
        console.log(`App listening on the PORT : ${process.env.PORT}`)
    })
    app.on("error",(err) => {  // errror -> error me change kiya hai
        console.log("Error after connection : ",err);
    })
})
.catch((err) => {
    console.log("Error while connecting to DB : ERR -> ",err)
})


































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