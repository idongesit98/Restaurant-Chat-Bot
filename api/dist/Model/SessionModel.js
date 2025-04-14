"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserSessionSchema = new mongoose_1.default.Schema({
    deviceId: {
        type: String,
        required: true
    },
    currentOrder: {
        type: Array,
        default: []
    },
    orderHistory: {
        type: Array,
        default: []
    },
    state: {
        type: String,
        enum: ["IDLE", "PAYING", "SELECTING", "SCHEDULING"],
        default: 'IDLE'
    }
});
exports.UserSession = mongoose_1.default.model("UserSession", UserSessionSchema);
