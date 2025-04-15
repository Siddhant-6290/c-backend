// here we are using promises but we can use try catch also

const asyncHandeller = (requestHandeller)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandeller(req,res,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandeller}


// using async await

// const asyncHandeller = (fn) => async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }