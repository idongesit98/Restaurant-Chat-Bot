"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserInput = validateUserInput;
const menu_1 = require("../menu");
function validateUserInput(msg, session) {
    const trimmed = msg.trim();
    if (session.state === "IDLE") {
        const validInputs = ["1", "97", "98", "0", "pay", "schedule", "help"];
        if (!validInputs.includes(trimmed)) {
            return { valid: false, error: "Invalid command. Type 1 to order or view options." };
        }
    }
    if (session.state === "SELECTING") {
        const isMenuOption = menu_1.menu.some(item => item.id.toString() === trimmed);
        if (trimmed !== "0" && trimmed !== "99" && !isMenuOption) {
            return { valid: false, error: "Invalid item. Enter a valid number or 99 to checkout." };
        }
    }
    if (session.state === "SCHEDULING") {
        const date = new Date(trimmed);
        if (isNaN(date.getTime()) || date < new Date()) {
            return { valid: false, error: "Invalid date/time. Use YYYY-MM-DD HH:mm (24hr)." };
        }
    }
    return { valid: true };
}
