const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedin, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Route - Display all listings
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedin,
    upload.single("listing[image]"),
    wrapAsync(listingController.createListing),
    validateListing
  );

// Route - Create new listing form
router.get("/new", isLoggedin, listingController.renderNewForm);

// Route - Show, Edit, Update, and Delete a single listing by ID
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedin,
    isOwner,
    upload.single("listing[image]"),
    wrapAsync(listingController.updateListing),
    validateListing
  )
  .delete(
    isLoggedin,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

// Route - Edit listing form
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

// Route - Display Billing Form for a listing
router.get(
  "/:id/invoice",
  isLoggedin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }
    res.render("listings/bill", { listing }); // Render the billing form view
  })
);

// Route - Handle Booking Form Submission and Display Invoice
router.post(
  "/:id/confirm",
  isLoggedin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // Check if the property is already booked
    if (listing.booked) {
      return res.status(400).render("listings/show", {
        message: "Property is full", // Display the message that the property is full
        listing
      });
    }

    // Extract data from the booking form
    const { name, bookingDate } = req.body;
    
    // Mark the listing as booked
    listing.booked = true;
    await listing.save();

    // Render the invoice page with booking details
    res.render("listings/invoice", {
      listing,
      name,
      bookingDate
    });
  })
);

// Route - Book a listing (Owner can mark a listing as booked)
router.post(
  "/:id/book",
  isLoggedin,
  isOwner,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // Mark the listing as booked
    listing.booked = true;
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
  })
);

// Route - Unbook a listing (Owner can unbook a listing)
router.post(
  "/:id/unbook",
  isLoggedin,
  isOwner,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // Mark the listing as unbooked
    listing.booked = false;
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
  })
);

module.exports = router;
