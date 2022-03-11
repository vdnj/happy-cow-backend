const express = require("express");
const mongoose = require("mongoose");
const formidable = require("express-formidable");
const cors = require("cors");
const app = express();
const restaurants = require("./restaurantsFull.json");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

require("dotenv").config();
app.use(formidable());
app.use(cors());

// PARTIE MONGOOSE - USER
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true,
});

const User = mongoose.model("users", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    vegStatus: String,
    city: String,
    yearOfBirth: Number,
  },
  token: String,
  hash: String,
  salt: String,
});

app.post("/user/signup", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      res.status(409).json({ message: "This email already has an account" });
    } else {
      if (
        req.fields.email &&
        req.fields.password &&
        req.fields.username &&
        req.fields.vegStatus &&
        req.fields.city &&
        req.fields.yearOfBirth
      ) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);

        const newUser = new User({
          email: req.fields.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.fields.username,
            vegStatus: req.fields.vegStatus,
            city: req.fields.city,
            yearOfBirth: req.fields.yearOfBirth,
          },
        });

        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
});

// PARTIE REQUÊTES RESTAURANTS
app.get("/", (req, res) => {
  res.json("Bienvenue sur l'API de Happy Cow");
});

app.get("/restaurants", (req, res) => {
  let { filter, actualShowing } = req.query;
  actualShowing = Number(actualShowing);

  try {
    let newData;
    if (filter === "Other") {
      newData = restaurants
        .filter(
          (el) =>
            el.type !== "vegan" &&
            el.type !== "vegetarian" &&
            el.type !== "Veg Store"
        )
        .slice(0, actualShowing);
    } else if (filter !== "null") {
      newData = restaurants
        .filter((el) => el.type === filter)
        .slice(0, actualShowing);
    } else {
      newData = restaurants.slice(0, actualShowing);
    }

    res.json(newData);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.get("/restaurant/:id", (req, res) => {
  let id = req.params.id;

  try {
    let data = restaurants.filter((el) => el.placeId === Number(id));
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/favorites", (req, res) => {
  const { favorites } = req.query;

  try {
    const splittedFav = favorites.split("-");
    const restaurantsData = [];
    splittedFav.forEach((id) => {
      const restToPushIndex = restaurants.findIndex((el) => {
        return String(el.placeId) === id;
      });
      restaurantsData.push(restaurants[restToPushIndex]);
    });

    res.json(restaurantsData);
  } catch (error) {
    res.status(400).json({ message: e.message });
  }
});

const server = app.listen(process.env.PORT, () => {
  console.log("Server started");
});
server.timeout = Number(process.env.SERVER_TIMEOUT) || 1000000;
