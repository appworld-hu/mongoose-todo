const express = require("express");
const session = require("express-session");
const { body, validationResult, matchedData } = require("express-validator");
const flash = require("express-flash");
const app = express();
const path = require('path')

const mongoose = require("mongoose");

const ejs = require("ejs");
app.set("view engine", ejs);
app.set("views", path.join(__dirname, "/views"));
 
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

  app.get("/", (req, res) => {
    res.render('index.ejs');
  });

  app.listen(3000, () => {
    console.log("running: localhost:3000");
  });
}
