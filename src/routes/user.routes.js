import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
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



export default router