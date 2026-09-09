import React from 'react'
import { create } from "zustand"
import { axiosInstance } from '../lib/axios';

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isChekingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        set({ isChekingAuth: true });

        try {
            const res = await axiosInstance.get("/auth/check")
            set({ authUser: res.data })
        } catch (error) {
            console.error("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isChekingAuth: false });
        }
    },
    clearAuth: () => {
        set({ authUser: null, isCheckingAuth: false, onlineUsers: [] });
        get().disconnectSocket();
    },
}))
