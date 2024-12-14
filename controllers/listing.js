const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const ExpressError = require("../utils/ExpressError");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

/** Helper Function: Add Coordinates */
const addCoordinates = async (listing) => {
  const response = await geocodingClient
    .forwardGeocode({
      query: listing.location,
      limit: 1,
    })
    .send();

  if (response.body.features && response.body.features.length > 0) {
    listing.geometry = response.body.features[0].geometry;
  } else {
    throw new ExpressError(400, "Location not found");
  }
  return listing;
};

/** Controller: Display All Listings */
module.exports.index = async (req, res) => {
  const search = req.query.search || "";
  const category = req.query.category || "";
  let allListings = [];

  try {
    if (category) {
      allListings = await Listing.find({ category });
    } else if (search) {
      allListings = await Listing.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $match: {
            $or: [
              { title: { $regex: `\\b${search}`, $options: "i" } },
              { location: { $regex: `\\b${search}`, $options: "i" } },
              { country: { $regex: `\\b${search}`, $options: "i" } },
              { "result.username": { $regex: `\\b${search}`, $options: "i" } },
              { category: { $regex: `\\b${search}`, $options: "i" } },
            ],
          },
        },
      ]);
    } else {
      allListings = await Listing.find({});
    }

    if (allListings.length === 0) {
      req.flash("error", "No listings found!");
      return res.redirect("/listings");
    }

    res.render("listings/index.ejs", { allListings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to retrieve listings!");
    res.redirect("/");
  }
};

/** Controller: Render New Listing Form */
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

/** Controller: Show Listing Details */
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  try {
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to retrieve the listing!");
    res.redirect("/listings");
  }
};

/** Controller: Create New Listing */
module.exports.createListing = async (req, res, next) => {
  try {
    const url = req.file.path;
    const filename = req.file.filename;

    let newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing = await addCoordinates(newListing);
    await newListing.save();

    req.flash("success", "New listing created successfully!");
    res.redirect(`/listings`);
  } catch (err) {
    next(err);
  }
};

/** Controller: Render Edit Form */
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    const originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to retrieve the listing for editing!");
    res.redirect("/listings");
  }
};

/** Controller: Update Listing */
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  try {
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to update the listing!");
    res.redirect(`/listings`);
  }
};

/** Controller: Delete Listing */
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Listing.findByIdAndDelete(id);
    console.log(deleted);
    req.flash("success", "Listing deleted successfully!");
    res.redirect(`/listings`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to delete the listing!");
    res.redirect("/listings");
  }
};

/** Controller: Book Listing */
module.exports.bookListing = async (req, res) => {
  const { id } = req.params;

  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (listing.booked) {
      req.flash("error", "Listing is already booked!");
      return res.redirect(`/listings/${id}`);
    }

    listing.booked = true;
    await listing.save();

    req.flash("success", "Listing successfully booked!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to book the listing!");
    res.redirect("/listings");
  }
};

/** Controller: Unbook Listing */
module.exports.unbookListing = async (req, res) => {
  const { id } = req.params;

  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    listing.booked = false;
    await listing.save();

    req.flash("success", "Listing successfully unbooked!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to unbook the listing!");
    res.redirect("/listings");
  }
};
