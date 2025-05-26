import { ApiError } from "../utils/ApiError.js";
import { asyncHandeller } from "../utils/asyncHandlers.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";


const generateAccessAndRefreshTokens= async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken=refreshToken;
        user.save({ validateBeforeSave: false });
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token");
    }
}



const registerUser = asyncHandeller(async(req,res) => {
    // res.status(200).json({
    //     message:"ok"
    // })

    // /get user details from frontend
    // /validation-not empty
    // check if already exist:username,email
    // check for images,check for avatar
    // upload them to cloudnary,avatar
    // create user object-create entry in db
    // remove password and referesh token field from response
    // check for user creation
    // return res


    const {fullName,email,username,password} = req.body
    console.log(email)
    // console.log(req.body); -- see the result, only has text data no files
    

    // validation-- empty check
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    // now check if user already exist
        const existedUser = await User.findOne({
                $or:[{username},{email}]
            })

        if(existedUser){
            throw new ApiError(409,"user with email or username exists")
        }

        // check for coverimage and avatar

        // console.log("printing req.files",req.files);
        

        const avatarLocalPath = req.files?.avatar[0]?.path;  // on server
        // const coverImageLocalPath=req.files?.coverImage[0]?.path;

        // classic check for coverImage coz we have not checked for it, if we do not send it then
        // we will get undefined,which gives error
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
            coverImageLocalPath=req.files.coverImage[0].path;
        }

        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar is required");
        }

        // upload on cloudinary

        const avatar = await uploadOnCloudinary(avatarLocalPath); // gives reference
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!avatar){
            throw new ApiError(400,"Avatar file is required")  //avatar is compulsary
        }

        // database entry of avatar
     const user = await User.create({
            fullName,
            avatar: avatar.url,  // the avatar give us whole response on cloudinary(util) we want url
            coverImage: coverImage?.url || "", //need to check if coverimage exist coz there were no checks prior like avatar had
            email,
            password,
            username:username.toLowerCase()

        })

        // check if user is created ,  .select() to select all fields and remove some
        const createduser = await User.findById(user._id).select(
            "-password -refereshToken"
        )

        if(!createduser){
            throw new ApiError(500,"something went wrong while registering the user")
        }

        // if everything is done now send the response

            return res.status(201).json(
                new ApiResponse(200,createduser,"User registered sucessfully")
            )


})

const loginUser = asyncHandeller(async(req,res) => {
    // req.body->data
    // username or  email ->what to use for authntication
    // find the user 
    // password check
    // access and refresh tokens
    // send cookie

    const {email,username,password}=req.body;

    if(!email || !username){
        throw new ApiError(400,"username or email is required")
    }

    // find the user with given username or email
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,'user does not exist')
    }

    // if user is found check for password -> can be done using bcrypt 
    const isPasswordValid = await user.isPasswordCorrect(password)

    // if not valid
    if(!isPasswordValid){
        throw new ApiError(401,'Invalid user credentials')
    }

    // if valid create RT and AT -> creating AT&RT is very commmon so we create seperate method 

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly : true,
        secure : true
    }

  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User LoggedIn sucessfully"
        )
    )
})



const logoutUser = asyncHandeller(async(req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
            
        },
        {
            // to get new val : undefined
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))

    
})


const refreshAccessToken = asyncHandeller(async(req,res)=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401,"invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user?._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken : newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandeller(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    // old password is correct now set new password 
    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandeller(async (req,res)=> {
    
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current User Fetched Sucessfully"))
})


const updateAccountDetails = asyncHandeller(async(req,res)=>{
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All the fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName, // we can directly write fullName only coz key value is same so omit keyname
                email: email
            }
        },
        {new : true} //helps in returning the information after updation
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details updated sucessfully"));
})

const updateUserAvatar = asyncHandeller(async (req,res)=>{
    const avatarLocalPath = req.file?.path  //req.file not files coz we are uploading single file 
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading an Avatar")
    }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            avatar: avatar.url
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar Image updated sucessfully"));
})


const updateUserCoverImage = asyncHandeller(async (req,res)=>{
    const coverImageLocalPath = req.file?.path  //req.file not files coz we are uploading single file 
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            coverImage: coverImage.url
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated sucessfully"));
})


// agg pipeleines
const getUserChannelProfile = asyncHandeller(async(req,res)=>{

    // if we want profile of channel we go to url of that channel
    const {username} = req.params
     
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    // we can find doc by User.find({username}) then get id then agg -> we can directly apply
    // agg->match

   const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            // finding subscriber- lookup
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }

        },
        {
            // how many i have subscribed
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // adding some field in user
            $addFields:{
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            // now we want to show only selected things from user
            $project:{
                fullName:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched sucessfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};

// manually
// app.get('/route', async (req, res, next) => {
//     try {
//       // your code
//     } catch (err) {
//       next(err); // required for Express to handle it
//     }
//   });


// Using asyncHandeller, you avoid this boilerplate:

// app.get('/route', asyncHandler(async (req, res) => {
//   // if any error happens, it's automatically caught
// }));
  



