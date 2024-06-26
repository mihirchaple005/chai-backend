import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({  
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())   // iss line me hamne cookies ka access diya jisse vho hame req and res se bhi mil paye 


//routes import 

import userRouter from "./routes/user.routes.js"

//routes declaration

app.use("/api/v1/user",userRouter)

// upper wale ki websites kuch iss taraha form hogi
// http://localhost:8000/api/v1/user/register

export { app }