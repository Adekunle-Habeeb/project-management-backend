const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook");
const User = require("./models/userModel"); // Import your User model

// Configure Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/wayfound",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      // Check if the user is already registered based on their Google profile or email
      const user = await User.findOne({
        $or: [
          { email: profile.emails[0].value },
          { 'google.id': profile.id },
        ],
      });

      if (user) {
        // User is already registered, so return the user
        return done(null, user);
      } else {
        // User not found, you can create a new user based on the Google profile
        const newUser = new User({
          email: profile.emails[0].value,
          // You can add more user attributes here as needed
          google: {
            id: profile.id,
            token: accessToken,
            // Any other Google-specific data you want to store
          },
        });

        await newUser.save();
        return done(null, newUser);
      }
    }
  )
);

// Configure Facebook authentication strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback"
},
async function(accessToken, refreshToken, profile, cb) {
  try {
    const user = await User.findOne({
      accountId: profile.id,
      provider: "facebook",
    });

    if (!user) {
      const newUser = new User({
        accountId: profile.id,
        name: profile.displayName,
        provider: profile.provider,
      });

      // Handle the absence of email and password fields
      // Set default values or handle it as per your application's logic
      // For example, you can generate a random password
      newUser.email = profile.email || "no-email@example.com";
      newUser.password = "your-default-password";

      await newUser.save();
      return cb(null, profile);
    }
    return cb(null, user);
  } catch (error) {
    return cb(error, false);
  }
}));

// Serialize and deserialize user methods remain the same
passport.serializeUser((user, done) => {
  done(null, user.id); // You may want to serialize by user.id
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
