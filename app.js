const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const methodOverride = require("method-override");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const configurePassport = require("./config/passport");

const connectDB = require("./config/db");

dotenv.config({ path: "./config/config.env" });

configurePassport(passport);

connectDB();

const app = express();

// Request Body Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method Overriding
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method
    delete req.body._method
    return method
  }
}));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Sets Handlebars as the view engine
const {formatDate, stripTags, truncate, editIcon, select} = require("./helpers/hbs");
app.engine(".hbs", exphbs({
  helpers: {
    formatDate,
    stripTags,
    truncate,
    editIcon,
    select
  },
  defaultLayout: "main",
  extname: ".hbs"
}));
app.set("view engine", ".hbs");

// Session Middleware
app.use(session({
  secret: "test",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global user variable
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Static Assets
app.use(express.static("./public"));

// Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/stories", require("./routes/stories"));

const PORT = process.env.PORT;

app.listen(PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));