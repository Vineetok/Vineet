const Listing = require("../models/listing");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const ExpressError = require("../utils/ExpressError");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const addCoordinates = async (listing) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: listing.location,  // Ensure it takes listing.location
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




module.exports.index = async (req, res) => {
  let search = req.query.search || "";
  let category = req.query.category || "";
  let allListings = [];
  if (category != "") {
    allListings = await Listing.find({ category: `${category}` });
  } else if (search !== "") {
    // allListings = await Listing.find({ title: { $regex: `\\b${search}`, $options: 'i' } }).populate("owner");
    // allListings = await Listing.find({
    //     $or: [
    //       { title: { $regex: `\\b${search}`, $options: 'i' } },
    //       { location: { $regex: `\\b${search}`, $options: 'i' } },
    //       { country: { $regex: `\\b${search}`, $options: 'i' } },
    //       { 'owner.username': { $regex: `\\b${search}`, $options: 'i' } }
    //     ]
    //   }).populate("owner").populate("reviews");
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
    if (allListings.length === 0) {
      throw new ExpressError(404, "No match found");
    }
  } else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  

  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }

  //   listing = await addCoordinates(listing);

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
 

    
  let url = req.file.path;
  let filename = req.file.filename;

  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {
    url,
    filename,
  };

  newListing = await addCoordinates(newListing);
 await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  // let {title, description, image, price, country, location} = req.body;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {
      url,
      filename,
    };
  }

  listing = await addCoordinates(listing);
  await listing.save();

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  // let {title, description, image, price, country, location} = req.body;
  let deleted = await Listing.findByIdAndDelete(id);
  console.log(deleted);
  req.flash("success", "Listing Deleted");
  res.redirect(`/listings`);
};
