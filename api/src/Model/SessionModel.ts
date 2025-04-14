import mongoose from "mongoose";

const UserSessionSchema = new mongoose.Schema({
    deviceId:{
        type:String,
        required:true
    },
    currentOrder:{
        type:Array,
        default:[]
    },
    orderHistory:{
        type:Array,
        default:[]
    },
    state:{
        type:String,
        enum:["IDLE","PAYING","SELECTING","SCHEDULING"],
        default:'IDLE'
    }
})

export const UserSession = mongoose.model("UserSession",UserSessionSchema);
