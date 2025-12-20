import User from "../models/User.js";
import jwt from "jsonwebtoken";

//Middleware to protect routes
export const protectRoute = async (req,res,next)=>{
    try {
        const token = req.headers.token;
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.json({success: false, message: "User Not Found"});
        
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute: ", error.message);
        res.status(401).json({success: false, message: "Invalid or expired token"})
    }
}