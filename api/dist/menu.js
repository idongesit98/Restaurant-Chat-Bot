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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpChaBot = exports.menu = void 0;
const SessionModel_1 = require("./Model/SessionModel");
const OrderModel_1 = require("./Model/OrderModel");
const paystack_1 = require("./utils/paystack");
const ScheduledOrder_1 = require("./Model/ScheduledOrder");
const validator_1 = require("./utils/validator");
exports.menu = [
    { id: 1, name: "Coconut Rice", price: 2000 },
    { id: 2, name: "Egusi and Fufu/Garri", price: 1500 },
    { id: 3, name: "Afang and Fufu/Garri", price: 1500 },
    { id: 4, name: "Afia Afere and Pounded Yam", price: 2000 },
    { id: 5, name: "Jollof Rice and Salad", price: 2000 },
    { id: 6, name: "Fried Rice", price: 1500 },
    { id: 7, name: "Peppered yam and Sauce", price: 2000 },
    { id: 8, name: "Chicken", price: 700 },
    { id: 9, name: "Beef", price: 700 },
    { id: 10, name: "Peppered Snail and Porridge Plantain", price: 5000 },
    { id: 11, name: "Ofada rice and Sauce/Stew/Banga Stew", price: 3000 }
];
const setUpChaBot = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("New User Connected:", socket.id);
        const deviceId = socket.handshake.query.deviceId;
        console.log("DeviceID:", deviceId);
        let session = yield SessionModel_1.UserSession.findOne({ deviceId });
        if (!session) {
            session = yield SessionModel_1.UserSession.create({ deviceId });
        }
        const sendMainMenu = () => {
            socket.emit("message", {
                text: "Welcome! Choose an option:\nTo Place an Order enter.......1\nCheckout..........99\nOrder History......98\nCurrent Order.....97\nCancel Order.......0\nTo schedule an order place an order and type schedule, follow the directions\nhelp  ",
            });
        };
        sendMainMenu();
        socket.on("message", (msg) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const validation = (0, validator_1.validateUserInput)(msg, session);
            if (!validation.valid) {
                socket.emit("message", { text: validation.error });
                return;
            }
            session = yield SessionModel_1.UserSession.findOne({ deviceId });
            if (!session)
                return socket.emit("message", { text: "Session not found. Please start again." });
            const trimmedMsg = msg.trim();
            if (session.state === "SCHEDULING") {
                const scheduledTime = new Date(trimmedMsg);
                if (isNaN(scheduledTime.getTime()) || scheduledTime < new Date()) {
                    socket.emit("message", { text: "Invalid or past date/time. Please enter a valid future time (YYYY-MM-DD HH:mm)" });
                }
                else {
                    yield ScheduledOrder_1.ScheduledOrder.create({
                        userId: deviceId,
                        items: session.currentOrder,
                        scheduledTime
                    });
                    session.currentOrder = [];
                    session.state = "IDLE";
                    yield session.save();
                    socket.emit("message", { text: `Order scheduled for ${scheduledTime.toLocaleString()}. Thank you!` });
                    sendMainMenu();
                }
                return;
            }
            switch (trimmedMsg) {
                case "help":
                    socket.emit("message", { text: "Type:\n1 - View menu and order\n97 - View cart,\n98 - View history,\n0 - Cancel order,\npay - Pay for pending order,\nschedule - Schedule delivery" });
                    return;
                case "97":
                    socket.emit("message", { text: `Current Order:\n${session.currentOrder.map(item => item.name).join(", ") || "No items yet."}` });
                    return;
                case "98":
                    socket.emit("message", { text: `Order History:\n${session.orderHistory.map(item => item.name).join(", ") || "No history."}` });
                    return;
                case "0":
                    session.currentOrder = [];
                    session.state = "IDLE";
                    yield session.save();
                    socket.emit("message", { text: "Order canceled." });
                    sendMainMenu();
                    return;
                case "pay":
                    const lastOrder = yield OrderModel_1.Order.findOne({ userId: deviceId }).sort({ createdAt: -1 });
                    if (!lastOrder || lastOrder.status !== "pending") {
                        socket.emit("message", { text: "No pending order found to pay" });
                        return;
                    }
                    const total = lastOrder.items.reduce((sum, item) => sum + item.price, 0);
                    socket.emit("message", { text: `Your total is #${total}. Processing payment link.....` });
                    const paymentResponse = yield (0, paystack_1.initializePayment)('customer@gmail.com', total);
                    if ((_a = paymentResponse === null || paymentResponse === void 0 ? void 0 : paymentResponse.data) === null || _a === void 0 ? void 0 : _a.authorization_url) {
                        socket.emit("message", { text: `Click to pay: ${paymentResponse.data.authorization_url}` });
                    }
                    else {
                        socket.emit("message", { text: "Payment initialization failed. Try again." });
                    }
                    return;
                case "schedule":
                    if (session.currentOrder.length === 0) {
                        socket.emit("message", { text: "Your cart is empty. Add items before scheduling an order." });
                    }
                    else {
                        session.state = "SCHEDULING";
                        yield session.save();
                        socket.emit("message", { text: "Please enter the scheduled time in the format YYYY-MM-DD HH:mm (24hr time)" });
                    }
                    return;
            }
            // Default behavior — depends on state
            if (session.state === "IDLE" && trimmedMsg === "1") {
                session.state = "SELECTING";
                yield session.save();
                const menuText = exports.menu.map(item => `${item.id}. ${item.name} - #${item.price}`).join('\n');
                socket.emit("message", {
                    text: `Great! Here's the menu:\n\n${menuText}\n\nType the number of the item to add to your order. Type 99 to checkout.`
                });
                return;
            }
            if (session.state === "SELECTING") {
                if (trimmedMsg === "0") {
                    session.currentOrder = [];
                    session.state = "IDLE";
                    yield session.save();
                    socket.emit("message", { text: "Order canceled." });
                    sendMainMenu();
                    return;
                }
                if (trimmedMsg === "99") {
                    if (session.currentOrder.length === 0) {
                        socket.emit("message", { text: "No items selected. Please start over." });
                    }
                    else {
                        yield OrderModel_1.Order.create({ userId: deviceId, items: session.currentOrder, status: "pending" });
                        session.orderHistory.push(...session.currentOrder);
                        session.currentOrder = [];
                        session.state = "IDLE";
                        yield session.save();
                        socket.emit("message", { text: "Order placed! Type 'pay' to make payment or 'schedule' to schedule." });
                        sendMainMenu();
                    }
                    return;
                }
                const selectedItem = exports.menu.find(item => item.id.toString() === trimmedMsg);
                console.log("Received message:", selectedItem);
                console.log("Received message:", trimmedMsg);
                if (selectedItem) {
                    session.currentOrder.push(selectedItem);
                    yield session.save();
                    socket.emit("message", { text: `${selectedItem.name} added! Select more or type 99 to checkout.` });
                }
                else {
                    socket.emit("message", { text: "Invalid item. Enter a valid number or 99 to checkout." });
                }
                return;
            }
            // Fallback
            socket.emit("message", { text: "Invalid command. Please choose from the main menu." });
        }));
    }));
};
exports.setUpChaBot = setUpChaBot;
