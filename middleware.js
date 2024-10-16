const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");


// this middleware check user is login or not
module.exports.isLoggedin = ((req,res,next)=>{
    console.log(req.user);
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listing");
     return res.redirect("/login");
            }
next();
});

//this middle store original url where user redirect after login
module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
next();
};

//this middleware check listing owner & currUser are same or not

module.exports.isOwner = async(req,res,next)=>{
    let { id } = req.params;
    let listing = await Listing.findById(id);
  
    if(!listing.owner._id.equals(res.locals.currUser._id)){
      req.flash("error", "you are not the owner of this listing");
       return res.redirect(`/listings/${id}`);
    }
   next();
}

//middle that validate req.body

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errorMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errorMsg);
    } else {
        next();
    }
};

  //middleware to validate reviews

module.exports.validateReview = (req,res,next)=>{
    let {error}=  reviewSchema.validate(req.body);
    if(error){
      let errMsg = error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,errMsg);
    }
    else{
      next();
    }
  }


  module.exports.isReviewAuthor = async(req,res,next)=>{
    let { id,reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    
    if(!review.author.equals(res.locals.currUser._id)){
      req.flash("error", "you are not the author of this review");
       return res.redirect(`/listings/${id}`);
    }
   next();
}

