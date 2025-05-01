const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const User = require('../models/User'); // your user model

dotenv.config();
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // First, try to find the user by googleId
        let user = await User.findOne({ googleId: profile.id });
        
        // If not found by googleId, check if the email exists
        if (!user && profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          // If user exists with this email but no googleId, update the user
          if (user) {
            user.googleId = profile.id;
            user.authType = 'google';
            if (!user.name) user.name = profile.displayName;
            if (profile.photos && profile.photos.length > 0 && !user.avatar) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
          }
        }
        
        // If still no user, create a new one
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : '',
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
            authType: 'google'
          });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});