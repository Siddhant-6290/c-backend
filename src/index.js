import dotenv from "dotenv"

import connectDB from "./db/index.js";
import express from "express";
const app=express();

dotenv.config({
    path:'./env'
})

connectDB()






// (async()=>{
// try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// } catch (error) {
//     console.error("Error: ",error)
//     throw error
// }
// })()