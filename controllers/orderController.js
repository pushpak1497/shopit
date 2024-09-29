import { Order } from "../models/orderModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { Product } from "../models/productModel.js";

// create new order using COD "/api/v1/orders/new"
export const newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    totalAmount,
    orderItems,
    shippingAmount,
    paymentMethod,
    taxAmount,
    paymentInfo,
    itemsPrice,
  } = req.body;
  const order = await Order.create({
    shippingInfo,
    totalAmount,
    orderItems,
    shippingAmount,
    paymentMethod,
    taxAmount,
    paymentInfo,
    itemsPrice,
    user: req.user._id,
  });
  return res.status(200).json({ order });
});

// get order based on ID -/api/v1/order/:id
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  return res.status(200).json({ order });
});

// get current users orders - /api/v1/me/orders/

export const getCurrentUserOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  return res.status(200).json({ orders });
});

// get all orders -ADMIN => /api/v1/admin/orders
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();
  return res.status(200).json({ orders });
});

// update orders -ADMIN => /api/v1/admin/orders/:id
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
  console.log(req.params);
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("no Order found with this id", 404));
  }
  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("The order is already delivered", 400));
  }
  order?.orderItems?.forEach(async (item) => {
    console.log(item.product.toString());
    const product = await Product.findById(item?.product.toString());
    console.log(product);
    product.stock = product.stock - item.quantity;
    await product.save();
  });

  order.orderStatus = req.body.status;
  order.deliveredAt = Date.now();
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    order,
    success: true,
  });
});

// delete order - ADMIN=>/api/v1/admin/orders/:id

export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found with the given ID", 404));
  }
  await order.deleteOne();
  return res.status(200).json({
    message: "Order successfully deleted",
    success: true,
  });
});

async function getSales(startDate, endDate) {
  const salesData = await Order.aggregate([
    {
      //stage 1:Filter Data
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      //stage 2:Group Data
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        totalSales: {
          $sum: "$totalAmount",
        },
        numOfOrders: { $sum: 1 },
      },
    },
  ]);

  console.log(salesData);
  //create a map to store sales data and num of orders by date
  const salesMap = new Map();
  let totalSales = 0;
  let totalNumOrders = 0;
  salesData.forEach((entry) => {
    const date = entry._id.date;
    const sales = entry.totalSales;
    const numOrders = entry?.numOfOrders;
    salesMap.set(date, { sales, numOrders });
    totalSales += sales;
    totalNumOrders += numOrders;
  });
  const datesBetween = getDatesBetween(startDate, endDate);
  console.log(datesBetween);
  //create final sales data array with 0 for dates without sales
  const finalSalesData = datesBetween.map((date) => ({
    date,
    sales: (salesMap.get(date) || { sales: 0 }).sales,
    numOrders: (salesMap.get(date) || { numOrders: 0 }).numOrders,
  }));
  return { salesData: finalSalesData, totalSales, totalNumOrders };
}

//Generate a array of dates between start date and end date
function getDatesBetween(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= new Date(endDate)) {
    const formattedDate = currentDate.toISOString().split("T")[0];

    dates.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
// Get Sales Data=>/api/v1/admin/get_sales
export const getSalesData = catchAsyncErrors(async (req, res, next) => {
  console.log(req.query);
  console.log(req.query.endDate);
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);
  const { salesData, totalSales, totalNumOrders } = await getSales(
    startDate,
    endDate
  );
  res.status(200).json({ sales: salesData, totalNumOrders, totalSales });
});
