import axios from "axios";
import dotenv from "dotenv";
import express, {Request,Response} from "express"
import crypto from 'crypto'


dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
export const initializePayment = async (email:string,amount:number,deviceId:string) => {
    try {
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount:amount * 100,
                currency:"NGN",
                callback_url:"https://598c-102-90-79-226.ngrok-free.app/payment-success",
                metadata:{
                    deviceId
                }
            },
            {
                headers:{
                    Authorization:`Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type":"application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error initializing payment:",error);
        return null;
    }
}

export function verifyPaystackSignature(req: Request, res: Response, buf: Buffer) {
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET!)
        .update(buf)
        .digest("hex");

    const signature = req.headers["x-paystack-signature"];
    if (signature !== hash) {
        throw new Error("Invalid Paystack signature");
    }
}

