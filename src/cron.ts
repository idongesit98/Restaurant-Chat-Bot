import cron from 'node-cron';
import { ScheduledOrder } from './Model/ScheduledOrder';
import { Order } from './Model/OrderModel';

cron.schedule("* * * * *", async () => {
    const now = new Date();

    const dueOrders = await ScheduledOrder.find({
        status:"Scheduled",
        scheduledTime:{$lte:now}
    });

    for(const order of dueOrders){
        await Order.create({
            userId: order.userId,
            items:order.items,
            status:"pending"
        });
        order.status = "processed";
        await order.save();

        console.log(`Processed scheduled order for user ${order.userId}`);
    }
})