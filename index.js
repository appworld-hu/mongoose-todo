const express = require("express");
const session = require("express-session");
const { body, validationResult, matchedData } = require("express-validator");
const flash = require("express-flash");
const app = express();
const path = require("path");

const mongoose = require("mongoose");

const Todo = require("./models/Todo");

const ejs = require("ejs");
const { ObjectId } = require("mongodb");
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

  app.get("/", async (req, res) => {
    
    const dbquery = {};

    let titleInfix = '';

    if( req.query.completed === '1' ) {
      titleInfix = 'elvégzett: ';
      dbquery.completed = true;
    }
    else if( req.query.completed === '0' ) {  
      titleInfix = 'várakozó: ';
      dbquery.completed = false;
    }

    const todos = await Todo.find( dbquery ).sort([['deadline', 'asc']]);

    const response = {
      title: `Bejegyzések ( ${titleInfix} ${todos.length} )`,
      page: "list",
      todos: todos,
    }

    if( todos.length === 0 )
      response.errors = [{msg: 'Nincs megjeleníthető elem!'}]
      res.render("index.ejs", response );
  });

  app.get("/add", (req, res) => {
    res.render("index.ejs", {
      title: "Bejegyzés hozzáadása",
      page: "add",
      errors: req.flash("errors"),
      old: req.flash("old")[0],
      success: req.flash("success"),
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

    async (req, res) => {
      const validation = validationResult(req);
      if (validation.isEmpty()) {
        const todo = new Todo(matchedData(req));
        await todo.save();
        req.flash('success', 'Sikeres mentés!');
      } else {
        req.flash("errors", validation.errors);
        req.flash("old", req.body);
      }
      res.redirect("back");
    }
  );

  app.post('/setstatus', async(req, res)=>{
    const doc = await Todo.findById (req.body._id);
    doc.completed = req.query.new === '0' ? false : true;
    await doc.save();
    req.flash('success', 'Sikeres módosítás!')
    res.redirect('back')
  })  
 //3000
  app.listen(3000, () => {
    console.log("running: localhost:3000");
  });
}
