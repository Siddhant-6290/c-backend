import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const connectDB= async()=>{
    try {
        const connectonInstance=await mongoose.connect(`${process.env.MONGODB_URI}/{DB_NAME}`)
        console.log(`\n MONGODB connected !! DB HOST:${connectonInstance.connection.host}`);
    } catch (error) {
        console.log("MONGO connection error",error);
        process.exit(1)
    }
}

export default connectDB