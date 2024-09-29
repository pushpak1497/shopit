import { ErrorHandler } from "../utils/errorHandler.js";

export default (err, req, res, next) => {
  let error = {
    statusCode: err?.statusCode || 500,
    message: err?.message || "Internal Server Error",
  };
  if (err.name === "CastError") {
    const message = `Invalid Resource Found. Invalid:${err.path}`;
    const error = new ErrorHandler(message, 404);
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((value) => value.message);
    const error = new ErrorHandler(message, 400);
  }
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    const error = new ErrorHandler(message, 400);
  }

  res.status(error.statusCode).json({
    message: error?.message,
    statusCode: error?.statusCode,
    error: err,
    stack: err?.stack,
  });
};
