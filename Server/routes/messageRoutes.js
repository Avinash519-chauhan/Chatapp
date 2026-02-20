import express from "express"
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, getQuickReply, generateImage } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/Users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);

//
messageRouter.post("/quick-reply", getQuickReply);
messageRouter.post("/image", generateImage);


export default messageRouter;