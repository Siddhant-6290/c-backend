import { ApiError } from "../utils/ApiError.js";
import { asyncHandeller } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const veriftJWT = asyncHandeller(async(req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        // if we hv token then using jwt we need to verify the token , the AT has email,id,username,fullname in it
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
     // _id is name kept for _id in auth
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if(!user){
        // todo:next video
        throw new ApiError(400,"Invalid Access Token")
        }
    
        req.user = user;
        next();
    } catch (error) {
       throw new ApiError(400,error?.message || "Invalid Access Token") ;
    }

})
