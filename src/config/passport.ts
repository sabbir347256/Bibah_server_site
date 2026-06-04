import passport from "passport";
import { Strategy as localStrategy } from "passport-local";
import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";

passport.use(
  "user-local",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const isUserExists = await User.findOne({ email });

        if (!isUserExists) {
          return done(null, false, { message: "User Does not Exist" });
        }

        if (isUserExists.role === "AGENT" || isUserExists.role === "ADMIN") {
          return done(null, false, {
            message: "Agents and Admins are not allowed to login here. Please use the valid portal.",
          });
        }

        const isGoogleAuthenticated = isUserExists?.auths?.some(
          (providerobject) => providerobject.provider === "google",
        );

        if (isGoogleAuthenticated) {
          return done(null, false, {
            message: "You have authenticated through google. Please login with google.",
          });
        }

        const isPasswordMatch = await bcryptjs.compare(
          password,
          isUserExists?.password as string,
        );

        if (!isPasswordMatch) {
          return done(null, false, { message: "Incorrect Password" });
        }

        return done(null, isUserExists);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  "agent-local",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log(email)
      try {
        const isUserExists = await User.findOne({ email });

        if (!isUserExists) {
          return done(null, false, { message: "Agent Account Does not Exist" });
        }

        if (isUserExists.role !== "AGENT" && isUserExists.role !== "ADMIN") {
          return done(null, false, {
            message: "This portal is only for Agents and Admins.",
          });
        }

        const isPasswordMatch = await bcryptjs.compare(
          password,
          isUserExists?.password as string,
        );

        if (!isPasswordMatch) {
          return done(null, false, { message: "Incorrect Password" });
        }

        return done(null, isUserExists);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});