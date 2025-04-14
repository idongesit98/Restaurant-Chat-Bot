import express, {Request,Response} from "express"
import http from "http";
import axios from "axios"
import { Server} from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { setUpChaBot} from "./menu";
import path from 'path';
import { Order } from "./Model/OrderModel";


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

app.get('/payment-callback', async (req: Request, res: Response) => {
    const { reference, trxref } = req.query;
    
    try {
        // Verify the payment with Paystack
        const verification = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`
                }
            }
        );

        if (verification.data.data.status === 'success') {
            const deviceId = verification.data.data.metadata.deviceId;
            
            // Update order status
            await Order.findOneAndUpdate(
                { paymentReference: reference },
                { status: 'completed' }
            );

            // Find and notify the user
            const sockets = await io.fetchSockets();
            const userSocket = sockets.find(socket => 
                socket.handshake.query.deviceId === deviceId
            );

            if (userSocket) {
                userSocket.emit('message', {
                    text: 'Payment successful! Thank you for your order.'
                });
                userSocket.emit("message", {
                    text:"Welcome! Choose an option:\nTo Place an Order enter 1\n Checkout 99\n Order History 98\n Current Order 97\n Cancel Order 0",
                });
            }

            return res.redirect('/?payment=success');
        }
        
        return res.redirect('/?payment=failed');
    } catch (error) {
        console.error('Payment verification error:', error);
        return res.redirect('/?payment=error');
    }
});

setUpChaBot(io);

mongoose.connect(process.env.Mongo_Uri!).then(() => console.log("DB Connected"));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
