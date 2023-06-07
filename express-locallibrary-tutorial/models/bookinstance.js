const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");
// this allows us to nicely format our date

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: "Book", required: true }, // reference to the associated book
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Available", "Maintenance", "Loaned", "Reserved"],
    default: "Maintenance",
  },
  due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance's URL
BookInstanceSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/bookinstance/${this._id}`;
});

// Format the date for presentation
BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// format the date to fill in the update form
BookInstanceSchema.virtual("due_back_formatted_update").get(function () {
  return DateTime.fromJSDate(this.due_back).toISODate();
});

// Export model
module.exports = mongoose.model("BookInstance", BookInstanceSchema);
