import React from 'react'
import { create } from "zustand"
import { axiosInstance } from '../lib/axios';
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.MODE === "devlopment" ? "http://localhost:3000" : "/";

//(set, get) two useful function
//set use to change the state
//
export const useAuthStore = create((set, get) => ({ //global authentication store
    //global variables
    authUser: null,
    isCheckingAuth: true,
    onlineUsers: [], //beign updated using socket.io code
    socket: null, //this store socket.io connection

    //Its job: Ask your backend: "Is this user authenticated?
    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {
            const res = await axiosInstance.get("/auth/check")
            set({ authUser: res.data })

            get().connectSocket(res.data);
        } catch (error) {
            console.error("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },
    //logout cleanup
    clearAuth: () => {
        set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
        get().disconnectSocket();
    },

    connectSocket: (user) => {
        if (!user || get().socket?.connected) return
        const socket = io(BASE_URL, { query: { userId: user._id } })
        set({ socket })
        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        })
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket?.connected) socket.disconnect();
        set({ socket: null });
    },
}))
