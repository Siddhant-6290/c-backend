import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema= new mongoose.Schema(
    {

    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
       type:String, //cloudnary url
       required:true,
    },
    coverImage:{
        type:String, //cloudnary url        
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refresgToken:{
        type:String,
    }

},{
    timestamps:true,
})


// for hashing/encrypting the password
userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next()
        this.password=bcrypt.hash(this.password,10)
        next()
})

// comparing password- original and hashed
userSchema.methods.isPasswordCorrect= async function (password){
    return await bcrypt.compare(password,this.password)
    // passwors->user, this.password->encrypted
}

// methods to generate access and refresh tokens
userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            // payload
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIREY
    }
)
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            // payload
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIREY
    }
)
} 

export const User = mongoose.model("User",userSchema)