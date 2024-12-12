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

// New Route - Show Invoice for a Listing
router.get(
   "/:id/invoice",
   isLoggedin, // Require the user to be logged in
   wrapAsync(async (req, res) => {
     const listing = await Listing.findById(req.params.id);
     if (!listing) {
       return res.status(404).send("Listing not found");
     }
     res.render("listings/invoice", { listing }); // Render the invoice view
   })
 );



module.exports = router;
