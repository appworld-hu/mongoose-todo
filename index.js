const express = require("express");
const session = require("express-session");
const { body, validationResult, matchedData } = require("express-validator");
const flash = require("express-flash");
const app = express();
const path = require("path");

const mongoose = require("mongoose");

const Todo = require("./models/Todo");

const ejs = require("ejs");
app.set("view engine", ejs);
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(`${__dirname}/public`));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    saveUninitialized: true,
    resave: false,
    secret: "mytopsecretstring",
  })
);
app.use(flash());

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/mongoose_todo");
  const todos = await Todo.find();

  app.get("/", (req, res) => {
    res.render("index.ejs", {
      title: "Bejegyzések",
      page: "list",
      todos: todos,
    });
  });

  app.get("/add", (req, res) => {
    res.render("index.ejs", {
      title: "Bejegyzés hozzáadása",
      page: "add",
      errors: req.flash("errors"),
      old: req.flash("old")[0],
    });
  });

  app.post(
    "/add",
    body("title")
      .notEmpty()
      .withMessage("A teendő nem lehet üres!")
      .isLength({ min: 4, max: 200 })
      .withMessage("A teendő minimum 4, maxmimum 200 karakter lehet!"),

    body("description")
      .notEmpty()
      .withMessage("A leírás nem lehet üres!")
      .isLength({ min: 4, max: 1000 })
      .withMessage("A leírás minimum 4, maximum 1000 karakter lehet!"),

    body("deadline")
      .isISO8601()
      .withMessage(
        "A teljesítés határideje csak érvényes, jövőbeli dátum lehet!"
      ),

    (req, res) => {
      const validation = validationResult(req);
      if (validation.isEmpty()) {
        res.end("ok");
      } else {
        req.flash("errors", validation.errors);
        req.flash("old", req.body);
        res.redirect("back");
      }
    }
  );

  app.listen(3000, () => {
    console.log("running: localhost:3000");
  });
}
