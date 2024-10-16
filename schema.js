const joi = require("joi");

module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      title: joi.string().required(),
      description: joi.string().required(),
      price: joi.number().required().min(0),
      country: joi.string().required(),
      location: joi.string().required(),
      image: joi.object({
        filename: joi.string().allow("", null), // Allow empty or null filename
        url: joi.string().uri().allow("", null), // Validate the URL format, allow empty or null
      }).required(), // Make the image object required
    })
    .required(),
});

module.exports.reviewSchema = joi.object({
  review: joi
    .object({
      rating: joi.number().min(1).max(5).required(),
      comment: joi.string().required(),
    })
    .required(),
});
