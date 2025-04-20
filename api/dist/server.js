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
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const menu_1 = require("./menu");
const path_1 = __importDefault(require("path"));
const OrderModel_1 = require("./Model/OrderModel");
const paystack_1 = require("./utils/paystack");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const PORT = process.env.PORT || 3030;
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "public", "chatbot.html"));
});
app.post("/paystack/webhook", express_1.default.json({ verify: paystack_1.verifyPaystackSignature }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = req.body;
    if (event.event === "charge.success") {
        const { reference, metadata } = event.data;
        const deviceId = metadata.deviceId;
        yield OrderModel_1.Order.findOneAndUpdate({ paymentReference: reference }, { status: "completed" });
        const sockets = yield io.fetchSockets();
        const userSocket = sockets.find(socket => socket.handshake.query.deviceId === deviceId);
        if (userSocket) {
            userSocket.emit("message", { text: "🎉 Payment successful! Thank you for your order." });
            userSocket.emit("message", {
                text: "🍽️ Welcome back! Choose an option:\n1. Place Order\n97. Current Order\n98. Order History\n0. Cancel Order"
            });
        }
    }
    res.sendStatus(200);
}));
app.get('/payment-success', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Payment Success</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding-top: 50px; }
                </style>
            </head>
            <body>
                <h2>✅ Payment Successful!</h2>
                <p>You can now return to the chatbot.</p>
                <script>
                    setTimeout(() => {
                        window.close(); // If opened in a new tab or window
                    }, 3000);
                </script>
            </body>
        </html>
    `);
});
(0, menu_1.setUpChaBot)(io);
mongoose_1.default.connect(process.env.Mongo_Uri).then(() => console.log("DB Connected"));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
