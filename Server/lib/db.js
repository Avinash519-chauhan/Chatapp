import mongoose from "mongoose";

//Function to connect to the mongobd database

export const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/Chatapp`).then(() => console.log("Mongodb connected"))
    } catch (error) {
        console.log(error);
    }
}