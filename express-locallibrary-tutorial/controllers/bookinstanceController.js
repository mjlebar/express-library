const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        errors: errors.array(),
        bookinstance: bookinstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookinstance.save();
      res.redirect(bookinstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  //   get book instance
  const bookinstance = await BookInstance.findById(req.params.id).exec();

  if (bookinstance === null) {
    //   no results
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete book instance",
    bookInstance: bookinstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  //   delete book instance

  await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // find author
  const [bookinstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find().exec(),
  ]);

  if (bookinstance === null) {
    // no results
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  for (const book of allBooks) {
    if (book._id.toString() === bookinstance.book._id.toString()) {
      book.selected = "true";
    }
  }

  res.render("bookinstance_form", {
    title: "Update book instance",
    bookinstance: bookinstance,
    book_list: allBooks,
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  //   validate and sanitize fields
  body("book", "Must select a book.").escape(),
  body("imprint", "Imprint must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status", "Invalid status").escape(),
  body("due_back", "Invalid due date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  //   process request after validation and sanitizatiion

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    // fixes a weird time zone glitch that makes dates go back by one on submission
    const daySeconds = 60 * 60 * 24 * 1000;
    const fixed_due_back = new Date(req.body.due_back.getTime() + daySeconds);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: fixed_due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // if there are errors, re render form

      const [bookinstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate("book").exec(),
        Book.find().exec(),
      ]);

      for (const book of allBooks) {
        if (book._id.toString() === bookinstance.book._id.toString()) {
          book.selected = "true";
        }
      }

      res.render("bookinstance_form", {
        title: "Update book instance",
        bookinstance: bookinstance,
        book_list: allBooks,
        error: errors.array(),
      });
      return;
    } else {
      // otherwise, update the author and redirect to their parge
      const theinstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {}
      );
      res.redirect(bookinstance.url);
    }
  }),
];
