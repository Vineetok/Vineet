const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedin,isOwner,validateListing}=require("../middleware.js");
const listingController=require("../controllers/listing.js");
const multer=require('multer');
const{storage}=require("../cloudConfig.js");
const upload=multer({storage});


router
.route("/")
.get( wrapAsync(listingController.index))
.post( 
   isLoggedin,
   upload.single('listing[image]'),
   wrapAsync(listingController.createListing),
   validateListing,
 );

// New Route - Form to create a new listing
router.get("/new",isLoggedin ,listingController.renderNewForm);

 router
 .route("/:id")
 .get(wrapAsync(listingController.showListing))
 .put(
    
    isLoggedin,
    isOwner,
    upload.single('listing[image]'),
    
    wrapAsync(listingController.updateListing),
    validateListing,
 )
 .delete(
    isLoggedin,
    isOwner,
    wrapAsync(listingController.destroyListing));

// Edit Route - Form to edit a listing by ID
router.get("/:id/edit",
    isLoggedin,
    isOwner,
     wrapAsync(listingController.renderEditForm));





module.exports = router;
