import passport from "passport";
import { Role } from "../modules/user/user.interface";
import { Strategy as localStrategy } from "passport-local";
import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";

passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done: any) => {
      try {
        const isUserExists = await User.findOne({ email });

        if (!isUserExists) {
          return done(null, false, { message: "User Does not Exist" });
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

passport.serializeUser((user: any, done: (err: any, id: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});
