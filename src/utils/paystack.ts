import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
export const initializePayment = async (email:string,amount:number) => {
    try {
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount:amount * 100,
                currency:"NGN",
                callback_url:"http://localhost:3030/payment-callback"
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