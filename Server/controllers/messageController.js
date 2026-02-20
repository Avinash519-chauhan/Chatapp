import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import axios from "axios";
import { model } from "mongoose";

//Get all user except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password",
    );

    // count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.messages);
    res.json({ success: false, messages: error.messages });
  }
};

// get all messages for selected user

export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true },
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.messages);
    res.json({ success: false, message: error.message });
  }
};

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.messages);
    res.json({ success: false, message: error.message });
  }
};

// send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uplodeResponse = await cloudinary.uploader.upload(image);
      imageUrl = uplodeResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    //emit the new message to the reciver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.messages);
    res.json({ success: false, message: error.message });
  }
};

//////////////////////////

const API_KEY = process.env.OPENROUTER_API_KEY;

export const getQuickReply = async (req, res) => {
  const { lastMessage } = req.body;

  const response = await axios.post(
    process.env.OPENROUTER_URL,
    {
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: lastMessage }],
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  );

  res.json({
    reply: response.data.choices[0].message.content,
  });
};

export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      process.env.OPENROUTER_URL,
      {
        model:"openai/gpt-3.5-turbo",
        messages: [{role:"user", content: prompt}],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    res.json({
      reply: response.data.choices[0].message.content,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
};
