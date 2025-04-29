import dotenv from "dotenv"

import connectDB from "./db/index.js";
// import express from "express";/
import { app } from "./app.js"; 

// const app=express();

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{

    // Handle runtime server errors
    app.on("error", (error) => {
        console.error("App Error:", error);
        throw error;
      });

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Db connection failed !!!",err);
})






// (async()=>{
// try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// app.on("error",(error)=>{
//     console.log(" ERRR:",error);
//     throw error;
// })
// app.listen(process.env.PORT || 8000,()=>{
//     console.log(`server is running on port ${process.env.PORT}`);
// })

// } catch (error) {
//     console.error("Error: ",error)
//     throw error
// }
// })()