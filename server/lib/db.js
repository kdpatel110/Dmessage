import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongo_Url = process.env.MONGO_URL; 
        if(!mongo_Url){
            throw new Error("Data base is required");
       }
       
       const conn = await mongoose.connect(mongo_Url);
       console.log("DB connected")
        
    } catch (error) {
        console.error("DB connection error ->", error.message);
        process.exit(1);
        //1-faliure 0-success
    }
}