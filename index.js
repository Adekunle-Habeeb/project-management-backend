require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const userRoute = require("./routes/userRoute");
const projectRoute = require("./routes/projectRoute");
const inviteRoute = require("./routes/invitationRoute");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors"); 
require("./auth");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // Adjust the pool size as needed
})
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: "http://127.0.0.1:5173"
}));

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

// ... (rest of your authentication routes)

app.get("/", (req, res) => {
  res.send("Hello wayFound");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
