import mongoose from "mongoose";

const ScheduledOrderSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    items:{
        type:Array,
        required:true,
    },
    scheduledTime:{
        type:Date,
        required:true
    },
    status: {
        type: String,
        enum: ["scheduled", "processed", "canceled"],
        default: "scheduled"
    }
},{timestamps:true})

export const ScheduledOrder = mongoose.model("ScheduledOrder",ScheduledOrderSchema);