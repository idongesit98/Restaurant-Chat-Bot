import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    items:{
        type:Array,
        required:true
    },
    status:{
        type:String,
        enum:["pending","completed"],
        default:"pending",
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

export const Order = mongoose.model("Order",OrderSchema);