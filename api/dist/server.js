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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const axios_1 = __importDefault(require("axios"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const menu_1 = require("./menu");
const path_1 = __importDefault(require("path"));
const OrderModel_1 = require("./Model/OrderModel");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "public", "chatbot.html"));
});
app.get('/payment-callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference, trxref } = req.query;
    try {
        // Verify the payment with Paystack
        const verification = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`
            }
        });
        if (verification.data.data.status === 'success') {
            const deviceId = verification.data.data.metadata.deviceId;
            // Update order status
            yield OrderModel_1.Order.findOneAndUpdate({ paymentReference: reference }, { status: 'completed' });
            // Find and notify the user
            const sockets = yield io.fetchSockets();
            const userSocket = sockets.find(socket => socket.handshake.query.deviceId === deviceId);
            if (userSocket) {
                userSocket.emit('message', {
                    text: 'Payment successful! Thank you for your order.'
                });
                userSocket.emit("message", {
                    text: "Welcome! Choose an option:\nTo Place an Order enter 1\n Checkout 99\n Order History 98\n Current Order 97\n Cancel Order 0",
                });
            }
            return res.redirect('/?payment=success');
        }
        return res.redirect('/?payment=failed');
    }
    catch (error) {
        console.error('Payment verification error:', error);
        return res.redirect('/?payment=error');
    }
}));
(0, menu_1.setUpChaBot)(io);
mongoose_1.default.connect(process.env.Mongo_Uri).then(() => console.log("DB Connected"));
server.listen(3030, () => console.log("Server running on port 3030"));
