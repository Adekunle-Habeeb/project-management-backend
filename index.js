require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const userRoute = require("./routes/userRoute");
const projectRoute = require("./routes/projectRoute");
const inviteRoute = require("./routes/invitationRoute");
const mongoose = require("mongoose");
const path = require("path");
require("./auth");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/public", express.static(path.join(__dirname, "client")));
app.use(express.json());
app.use("/user", userRoute);
app.use("/project", projectRoute);
app.use("/invite", inviteRoute);


app.use(
  session({
    secret: "your-secret-key", 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});

app.get('/auth/google/',
  passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/client/home.html');
  });


app.get("/", (req, res) => {
  res.send("Hello wayFound");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
