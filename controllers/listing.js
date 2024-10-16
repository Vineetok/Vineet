const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const addCoordinates = async (listing) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: listing.location,
      limit: 1,
    })
    .send();

  listing.geometry = response.body.features[0].geometry;
  return listing;
};

module.exports.index = async (req, res) => {
  let search = req.query.search || "";
  let category = req.query.category || "";
  let allListings = [];

  // Filter by category if one is provided
  if (category !== "") {
    if (category === "Trending") {
      // Fetch trending listings based on a flag
      allListings = await Listing.find({ trending: true });
    } else if (category === "Cabin") {
      // Fetch listings for Cabins
      allListings = await Listing.find({ category: "Cabin" });
    } else if (category === "Adventure") {
      // Fetch listings for Adventure
      allListings = await Listing.find({ category: "Adventure" });
    } else if (category === "Countryside") {
      // Fetch listings for Countryside
      allListings = await Listing.find({ category: "Countryside" });
    } else if (category === "Ski") {
      // Fetch listings for Ski
      allListings = await Listing.find({ category: "Ski" });
    } else if (category === "Nature") {
      // Fetch listings for Nature
      allListings = await Listing.find({ category: "Nature" });
    } else if (category === "Luxury") {
      // Fetch listings for Luxury
      allListings = await Listing.find({ category: "Luxury" });
    } else if (category === "Lake") {
      // Fetch listings for Lake
      allListings = await Listing.find({ category: "Lake" });
    } else if (category === "Beach") {
      // Fetch listings for Beach
      allListings = await Listing.find({ category: "Beach" });
    } else if (category === "Historic") {
      // Fetch listings for Historic
      allListings = await Listing.find({ category: "Historic" });
    } else if (category === "Mountain") {
      // Fetch listings for Mountain
      allListings = await Listing.find({ category: "Mountain" });
    } else if (category === "Rooms") {
      // Fetch listings for Rooms (default)
      allListings = await Listing.find({ category: "Rooms" });
    }
  } else if (search !== "") {
    // Search logic
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
    // Default: fetch all listings if no category or search is provided
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings });
};


  module.exports.renderNewForm = (req, res) => {
    res.render("./listings/new.ejs");
  };

 module.exports.showListing=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({
      path:"reviews",
      populate:{
          path:"author",
          select:"username"
      },
  })
  .populate("owner","username");

  if (!listing) {
      req.flash("error","Listing you requested for does not exist");
    return  res.redirect("/listings");
  }
  if(!listing.geometry){
  let response = await geocodingClient.forwardGeocode({
    query: listing.location,
    limit: 1
  })
  .send();
  listing.geometry = response.body.features[0].geometry;
 
}
res.render("listings/show.ejs", { listing });
 }
module.exports.createListing=async (req, res) => {
 let response= await geocodingClient.forwardGeocode({
    query:req.body.listing.location,
    limit:1,
   })
   .send();
}
   
  if (!req.file) {
    req.flash("error", "Image upload failed or missing.");
    return res.redirect("/listings/new");
  }
let url=req.file.path;
let filename=req.file.filename;

  const newListing = new Listing(req.body.listing);
newListing.owner=req.user._id;
newListing.image={url,filename};

newListing.geometry=response.body.features[0].geometry;

let savedListing=await newListing.save();
console.log(savedListing);
req.flash("success","New Listing Created");
res.redirect("/listings");


module.exports.renderEditForm=async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
      req.flash("error", "Listing you requested for doesnt exist");
return res.redirect("/listings");
 }
 let originalImageUrl=listing.image.url;
 originalImageUrl=originalImageUrl.replace("/upload","/upload/h_300,w_250");
  res.render("listings/edit.ejs", { listing,originalImageUrl });
};

module.exports.updateListing=async (req, res) => {
  let{ id } = req.params;
 let listing= await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
 
 if(typeof req.file!=="undefined"){
 let url=req.file.path;
 let filename=req.file.filename;
 listing.image={url,filename};
await listing.save();
 }
 req.flash("success","Listing updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing=async (req, res) => {
  let{ id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success","Listing deleted");
  res.redirect("/listings");
};