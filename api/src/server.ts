import express, {Request,Response} from "express"
import http from "http";
import axios from "axios"
import { Server} from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { setUpChaBot} from "./menu";
import path from 'path';
import { Order } from "./Model/OrderModel";
import { verifyPaystackSignature } from "./utils/paystack";


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server,{cors:{origin:"*"}});
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET
const PORT = process.env.PORT || 3030

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get("/",(req,res) => {
    res.sendFile(path.join(__dirname,"public","chatbot.html"));
});


app.post("/paystack/webhook", express.json({ verify: verifyPaystackSignature }), async (req, res) => {
    const event = req.body;

    if (event.event === "charge.success") {
        const { reference, metadata } = event.data;
        const deviceId = metadata.deviceId;

        await Order.findOneAndUpdate(
            { paymentReference: reference },
            { status: "completed" }
        );

        const sockets = await io.fetchSockets();
        const userSocket = sockets.find(socket =>
            socket.handshake.query.deviceId === deviceId
        );

        if (userSocket) {
            userSocket.emit("message", { text: "🎉 Payment successful! Thank you for your order." });
            userSocket.emit("message", {
                text: "🍽️ Welcome back! Choose an option:\n1. Place Order\n97. Current Order\n98. Order History\n0. Cancel Order"
            });
        }
    }

    res.sendStatus(200);
});

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

setUpChaBot(io);

mongoose.connect(process.env.Mongo_Uri!).then(() => console.log("DB Connected"));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
