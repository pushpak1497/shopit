import { Product } from "../models/productModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ApiFilter from "../utils/apiFilters.js";
import { Order } from "../models/orderModel.js";
import { upload_file, deleteFile } from "../cloudinary.js";

export const getProducts = async (req, res, next) => {
  const resPerPage = 4;
  // return next(new ErrorHandler("Hello", 400));
  console.log(req.query);

  const apiFilters = new ApiFilter(Product.find(), req.query).search().filter();
  // console.log(apiFilters);
  let products = await apiFilters.query;
  // console.log(products);
  const productsCount = products.length;
  apiFilters.pagination(resPerPage);
  products = await apiFilters.query.clone();

  return res.status(200).json({
    productsCount,
    resPerPage,
    products,
  });
};

export const newProduct = catchAsyncErrors(async (req, res) => {
  req.body.user = req.user._id;
  const product = await Product.create(req.body);

  return res.status(200).json({
    product,
  });
});

export const getSingleProductDetails = catchAsyncErrors(
  async (req, res, next) => {
    const { productId } = req.params;
    console.log(productId);
    const product = await Product.findById(productId).populate("reviews.user");
    if (!product) {
      return next(new ErrorHandler("product not found", 404));
    }
    return res.status(200).json(product);
  }
);

export const updateProductDetails = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  console.log("test");
  let product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("product not found", 404));
  }
  product = await Product.findByIdAndUpdate(productId, req.body, {
    new: true,
  });
  return res.status(200).json({ product, message: "updated successfully" });
});

export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ErrorHandler("product not found", 404));
  }
  //delete images related to product
  for (let i = 0; i < product?.images?.length; i++) {
    await deleteFile(product?.images[i].public_id);
  }
  await Product.findByIdAndDelete(id);
  return res.status(200).json({ message: "deleted successfully" });
});
//  create/update review => /api/v1/reviews
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    rating: Number(rating),
    user: req?.user._id,
    comment,
  };
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("product not found with the given ID", 404));
  }
  const isReviewed = product?.reviews?.find(
    (r) => r.user.toString() === req?.user._id.toString()
  );
  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req?.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.noOfReviews = product.reviews.length;
  }
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;
  await product.save({ validateBeforeSave: false });
  return res.status(200).json({
    message: "review posted",
    success: true,
  });
});
// get all the reviews for a particular product => /api/v1/reviews
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);
  if (!product) {
    return next(new ErrorHandler("product not found with the given ID", 404));
  }
  return res.status(200).json({
    reviews: product.reviews,
  });
});

// delete a review - ADMIN => /api/v1/admin/reviews/
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    return next(new ErrorHandler("product not found with the given ID", 404));
  }
  product.reviews = product?.reviews?.filter(
    (review) => review._id.toString() !== req?.query?.id.toString()
  );
  product.noOfReviews = product.reviews.length;
  if (product.reviews.length) {
    product.rating = 0;
  } else {
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
  }
  await product.save({ validateBeforeSave: false });
  return res.status(200).json({
    message: "review deleted successfully",
    success: true,
  });
});

// can user Review =>/api/v1/products/:id

export const canUserReview = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({
    user: req?.user?._id,
    "orderItems.product": req.query.productId,
  });
  if (orders.length === 0) {
    return res.status(200).json({ canReviewed: false });
  }
  return res.status(200).json({ canReviewed: true });
});
// get all the products - ADMIN => /api/v1/admin/products
export const getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({ products });
});

// upload product images => /api/v1/admin/products/:id/upload_images

export const uploadProductImages = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req?.params?.id);
  if (!product) {
    return next(new ErrorHandler("product not found in database", 404));
  }
  const uploader = async (image) => upload_file(image, "shopit/products");
  const urls = await Promise.all((req?.body?.images).map(uploader));
  product?.images?.push(...urls);
  await product.save();
  res.status(200).json({ product });
});
//delete product images => /api/v1/admin/products/:id/delete_image
export const deleteProductImage = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
  const product = await Product.findById(req?.params?.id);
  console.log("test1");
  if (!product) {
    return next(new ErrorHandler("product not found in database", 404));
  }
  console.log("test");
  const isDeleted = await deleteFile(req.body.imageId);
  console.log(isDeleted);
  if (isDeleted) {
    product.images = product.images.filter(
      (img) => img.public_id != req.body.imageId
    );
  }
  await product.save();
  res.status(200).json({ product });
});
