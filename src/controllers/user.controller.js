import { asyncHandeller } from "../utils/asyncHandlers.js";

const registerUser = asyncHandeller(async(req,res) => {
    res.status(200).json({
        message:"ok"
    })
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
  