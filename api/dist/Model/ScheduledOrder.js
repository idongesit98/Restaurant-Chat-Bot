"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ScheduledOrderSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "processed", "canceled"],
        default: "scheduled"
    }
}, { timestamps: true });
exports.ScheduledOrder = mongoose_1.default.model("ScheduledOrder", ScheduledOrderSchema);
