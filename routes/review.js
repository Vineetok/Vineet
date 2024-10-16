/* FILES REQUIRES */
const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { validateReview, isLoggedin, isReviewAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

//Reviews(post route to create reviews);

router.post(
  "/",isLoggedin,
  validateReview,
  wrapAsync(reviewController.createReview)
);

//Delete route (to delete reviews);

router.delete(
  "/:reviewId",isLoggedin,isReviewAuthor,
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
