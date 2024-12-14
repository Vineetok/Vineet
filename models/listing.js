const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'],
            required: true, // 'location.type' must be 'Point'
        },
    },
    coordinates: {
        type: [Number],
        required: true,
    },
    category: {
        type: String,
        enum: [
            'Cabin', 'Adventure', 'Countryside', 'Trending', 'Ski', 'Nature', 'Luxury',
            'Lake', 'Beach', 'Historic', 'Mountain', 'Urban', 'Rooms', 'Iconic_Cities',
            'Mountains', 'Castles', 'Amazing_Pool', 'Camping', 'Farms', 'Arctic', 'Domes',
            'House_Boats'
        ],
    },
    booked: {
        type: Boolean,
        default: false,
    },
});

// Update booking status to true when a user confirms a booking
listingSchema.methods.bookProperty = async function() {
    if (this.booked) {
        throw new Error("Property is already booked.");
    }
    this.booked = true;
    await this.save();
};

// Hook to delete reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
