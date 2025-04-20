"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePayment = void 0;
exports.verifyPaystackSignature = verifyPaystackSignature;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const initializePayment = (email, amount, deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amount * 100,
            currency: "NGN",
            callback_url: "https://598c-102-90-79-226.ngrok-free.app/payment-success",
            metadata: {
                deviceId
            }
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Error initializing payment:", error);
        return null;
    }
});
exports.initializePayment = initializePayment;
function verifyPaystackSignature(req, res, buf) {
    const hash = crypto_1.default
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(buf)
        .digest("hex");
    const signature = req.headers["x-paystack-signature"];
    if (signature !== hash) {
        throw new Error("Invalid Paystack signature");
    }
}
