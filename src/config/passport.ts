import passport from "passport";
import { Strategy as localStrategy } from "passport-local";
import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";
import { IsActive, Role } from "../modules/user/user.interface";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import envVars from "./envars";

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

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      passReqToCallback: true 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: "Email not found from Google account" });
        }

        const cleanEmail = email.toLowerCase().trim();

        let user = await User.findOne({
          $or: [
            { "auths.providerID": profile.id, "auths.provider": "google" },
            { email: cleanEmail }
          ]
        });

        if (!user) {

          const bonusRefarelID = req.query.state || req.query.ref || null;

          const dummyPassword = Math.random().toString(36).slice(-10);
          const hashedPassword = await bcryptjs.hash(dummyPassword, 10);

          user = new User({
            fullName: profile.displayName || "Google User",
            email: cleanEmail,
            role: Role.USER,
            isActive: IsActive.INACTIVE, 
            isVerified: true,
            isApproved: true,
            profileImage: profile.photos?.[0]?.value || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            birth: "2000-01-01",
            gender: "UNKNOWN",
            profession: "Google User",
            contactNo: `google_${profile.id}`,
            nidNo: `google_${profile.id}`,
            password: hashedPassword,
            bonusRefarelID: bonusRefarelID,
            auths: [{ provider: "google", providerID: profile.id }]
          });

          if (bonusRefarelID && typeof bonusRefarelID === "string") {

            const referrer = await User.findOne({ ownRefarelID: bonusRefarelID }) as any;

            if (referrer && referrer.isActive === IsActive.ACTIVE) {
              if (referrer.role === Role.AGENT) {
                referrer.totalAmount = (referrer.totalAmount || 0) + 70;
              } else if (referrer.role === Role.USER) {
                referrer.bonusWalletPoints = (referrer.bonusWalletPoints || 0) + 100;
              }
              await referrer.save();
            }
          }

          await user.save();
        } else {
          const hasGoogleAuth = user.auths.some(auth => auth.provider === "google");
          if (!hasGoogleAuth) {
            user.auths.push({ provider: "google", providerID: profile.id });
            await user.save();
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
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