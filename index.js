const express = require("express");
const session = require("express-session");
const { body, validationResult, matchedData } = require("express-validator");
const flash = require("express-flash");
const app = express();
const path = require("path");
require('dotenv').config() 
const cookieParser = require("cookie-parser");

const mongoose = require("mongoose");

const Todo = require("./models/Todo");

const ejs = require("ejs");
const { ObjectId } = require("mongodb");
app.set("view engine", ejs);
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(`${__dirname}/public`));
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    saveUninitialized: true,
    resave: false,
    secret: "mytopsecretstring",
    cookie: { maxAge: 60 * 60* 24 * 30 * 1000 },
  })
);
app.use(flash());

const mustLogin =  function(req, res, next){
  if( req.session.user ){
    next();
  } else {
    res.redirect('/login')
  }
} 

const user = {
  name: 'Anikó',
  email: 'somogyianiko37@gmail.com',
  password: '123456'
}

const validationRules = [body("title")
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
)]

main().catch((err) => console.log(err)); 

async function main() {
  // await mongoose.connect("mongodb://127.0.0.1:27017/mongoose_todo");
  await mongoose.connect(process.env.MONGOURL);

  app.get("/login", (req, res) => {
    //console.dir(req.session)
    res.render("index.ejs", {
      title: "Belépés",
      page: "login",
      errors: req.flash("errors"), 
      old: req.flash("old")[0]
    });
  });

  app.post('/login',(req, res)=>{
    if( req.body.email === 'somogyianiko37@gmail.com' && req.body.password === '123456' )
      {
        req.session.user = user;
        res.redirect('/')
      }
    else 
      {
        req.flash('errors', [{msg: 'Hibás adatok!'}])
        res.redirect('back')
      }
  })

  app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
  });

  app.get("/", mustLogin, async (req, res) => {
    
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
      user: req.session.user
    }

    if( todos.length === 0 )
      response.errors = [{msg: 'Nincs megjeleníthető elem!'}]
      res.render("index.ejs", response );
  });

  app.get("/add", mustLogin, (req, res) => {
    res.render("index.ejs", {
      title: "Bejegyzés hozzáadása",
      page: "add",
      errors: req.flash("errors"),
      old: req.flash("old")[0],
      success: req.flash("success")
    });
  });

  app.post(
    "/add",
    mustLogin,
    ...validationRules,

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

  app.get("/edit", mustLogin, async (req, res) => {
    const doc = await Todo.findById(req.query.item)
    res.render("index.ejs", {
      title: "Bejegyzés módosítása",
      page: "edit",
      errors: req.flash("errors"),
      old: req.flash("old")[0],
      success: req.flash("success"),
      item: doc
    });
  });

  app.post(
    "/edit",
    mustLogin,
    ...validationRules,

    async (req, res) => {
      const validation = validationResult(req);
      if (validation.isEmpty()) {
        
        const doc = await Todo.findById(req.query.item)
        
        doc.title = req.body.title;
        doc.description = req.body.description;
        doc.deadline = req.body.deadline;
        await doc.save();

        req.flash('success', 'Sikeres módosítás!');
      } else {
        req.flash("errors", validation.errors);
        req.flash("old", req.body);
      }
      res.redirect("back");
    }
  );


  app.post('/setstatus', mustLogin, async(req, res)=>{
    const doc = await Todo.findById (req.body._id);
    doc.completed = req.query.new === '0' ? false : true;
    await doc.save();
    req.flash('success', 'Sikeres módosítás!')
    res.redirect('back')
  })  
 //3000
  app.listen(process.env.PORT, () => {
    console.log("running: localhost "+process.env.PORT);
  });
}
