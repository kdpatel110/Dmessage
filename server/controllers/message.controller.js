import express from "express";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"
import { getReceiverSocketId } from "../lib/socket.js";

export async function getUserForSidebar(req, res) {
    try {
        const loggedinUserId = req.user._id

        const filteredUsers = await User.find({ _id: { $ne: loggedinUserId } }).select("-clerkId")

        res.status(200).json(filteredUsers)
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getConversationForSidebar(req, res) {
    try {
        const loggedinUserId = req.user._id

        const conversations = await Message.aggregate([
            //STEP-1 keep only the message i sent or received
            {
                $match: {
                    $or: [
                        { senderId: loggedinUserId }, { receiverId: loggedinUserId }
                    ]
                }
            },

            //STEP-2 Group all messages by the person I'm chatting with, and find the latest message time for each person
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", loggedinUserId] },
                            "$receiverId",
                            "$senderId"
                        ]
                    },
                    lastMessageAt: {
                        $max: "$createdAt"
                    },
                }
            },

            //STEP-3 put the most recent conversation at the top
            {
                $sort: { lastMessageAt: -1 } // -1 puts the most recent date at the top
            },

            //STEP-4 look up each partner's user profile(come back as an array)
            {
                $lookup: {
                    from: "users",
                    as: "user",
                    localField: "_id",
                    foreignField: "_id",
                }
            },

            // 5. Pull that profile out of the array and make it the document.
            {
                $replaceRoot: {
                    newRoot: { $first: "$user" }
                }
            },

            // 6. Hide the private clerkId field from the result.
            { $project: { clerkId: 0 } },
        ])
        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversationsForSidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getMessage(req, res) {
    try {
        const { id: userToChatId } = req.params
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        }).sort({ createdAt: 1 })

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ message: "Internal Server error" });
    }
}

export async function sendMessage(req, res) {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        let videoUrl;

        if (req.file) {
            if (!hasImageKitConfig()) {
                return res.status(500).json({ message: "Media upload is not configured" });
            }

            const url = await uploadChatMedia(req.file);
            if (req.file.mimetype.startWith("video/")) {
                videoUrl = url;
            } else {
                imageUrl = url;
            }

            const newMessage = new Message({
                senderId,
                receiverId,
                text,
                image: imageUrl,
                video: videoUrl,
            })

            await newMessage.save()
            //TODO : realtime with socketio
            const receiverSocketId = getReceiverSocketId(receiverId)
            //only sned the message in realtime if user is online
            if(receiverSocketId){
                io.to(receiverSocketId).emit("newMessage", newMessage)
            }

            res.status(201).json(newMessage)
        }   
    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({Message: "Internal server error"});
    }
}


