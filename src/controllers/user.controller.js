import { ApiError } from "../utils/ApiError.js";
import { asyncHandeller } from "../utils/asyncHandlers.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

    // validation-- empty check
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    // now check if user already exist
        const existedUser = User.findOne({
                $or:[{username},{email}]
            })

        if(existedUser){
            throw new ApiError(409,"user with email or username exists")
        }

        // check for coverimage and avatar

        const avatarLocalPath = req.files?.avatar[0]?.path;  // on server
        const coverImageLocalPath=req.files?.coverImage[0]?.path;

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
     const user = User.create({
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


export {registerUser};

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
  