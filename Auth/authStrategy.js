import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../model/userModel.js";
import config from "../config.js";

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.tokenSecret,
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      // el argumento jwtPayload = { id: usuario._id, iat, exp }
      const user = await User.findById(jwtPayload.id).select('-password');
      if (!user) {
        return done(null, false);
      }
      return done(null, { id: user._id, isAdmin: user.isAdmin, iat: jwtPayload.iat, exp: jwtPayload.exp});
    }
    catch (error) {
      return done(error, false);
    }
  })
);

export default passport;