const express = require("express");
const mongoose = require("mongoose");
const formidable = require("express-formidable");
const cors = require("cors");
const app = express();
const restaurants = require("./restaurantsFull.json");
require("dotenv").config();
app.use(formidable());
app.use(cors());

// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
// });

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
