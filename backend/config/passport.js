const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          authType: 'google',
          avatar: profile.photos[0].value || ''
        });
        await user.save();
      } else {
        user.googleId = profile.id;
        user.authType = 'google';
        user.avatar = profile.photos[0].value || user.avatar;
        await user.save();
      }
    }
    console.log('Passport Google user:', { _id: user._id, name: user.name, email: user.email, avatar: user.avatar });
    done(null, user);
  } catch (error) {
    console.error('Passport Google error:', error);
    done(error, null);
  }
}));