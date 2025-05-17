import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { veriftJWT } from "../middlewares/auth.middlewares.js";
const router = Router();


// router.route("/login").post(login)  just an example
// .post(mw,login)--> this is how we pass mw
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",  // this name should be same as what comes from frontend
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// securd routes

router.route("/logout").post(veriftJWT,logoutUser)


export default router