const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.SECRET_USER_NAME}:${process.env.SECRET_PASS}@cluster0.z9hqskk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // user Collection
    const userCollection = client.db("Foodie_Exchange").collection("user");
    // foodCollection
    const foodCollection = client
      .db("Foodie_Exchange")
      .collection("foodCollection");
    // reviews collection
    const reviewsCollection = client
      .db("Foodie_Exchange")
      .collection("foodReviews");
    // cart collection
    const cartCollection = client.db("Foodie_Exchange").collection("cart");
    const bookingCollection = client
      .db("Foodie_Exchange")
      .collection("booking");
    // jwt Start
    app.post("/api/v1/jwt", (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(
        userEmail,
        process.env.SECRET_TOKEN
        //   {
        //   expiresIn: "1h",
        // }
      );
      res.send({ token });
    });

    // medalWer 🎪🎪
    // verified token 🎇🎆
    const gatemen = (req, res, next) => {
      // console.log("gatemen ", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      // console.log(token);
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        // console.log("==>", decoded);
        next();
      });
    };
    // verified admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.roll === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    // verified token stop🎆 // verified token 🎇🎆

    app.get("/api/v1/user/admin/:email", gatemen, async (req, res) => {
      // console.log("==>", decoded);

      const email = req.params.email;
      // console.log("decode", req.decoded.email, email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.roll === "admin";
      }
      res.send({ admin });
    });

    // user info🎃🎃
    app.get("/api/v1/user", gatemen, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // post
    app.post("/api/v1/user", async (req, res) => {
      const userInfo = req.body;
      // console.log(userInfo);
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });
    // delete user
    app.delete(
      "/api/v1/delete-user/:id",
      gatemen,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);
        res.send(result);
      }
    );

    //roll
    app.patch(
      "/api/v1/roll_set/:id",
      gatemen,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const updateDoc = {
          $set: {
            roll: "admin",
          },
        };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          option
        );
        res.send(result);
      }
    );
    app.patch("/api/v1/updateItem/:id", async (req, res) => {
      const id = req.params.id;
      const menuItem = req.body;
      console.log(menuItem.name);

      // console.log("update id", id);
      const filter = { _id: new ObjectId(id) };
      // const option = { upsert: true };
      const updateDoc = {
        $set: {
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          recipe: menuItem.recipe,
          image: menuItem.image,
        },
      };
      const result = await foodCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // ////////
    app.patch("/api/v1/accept_booking/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
      // console.log(booking.activity, id);

      console.log("update id", id);
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          activity: booking.activity,
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.send(result);
    });
    // booking post
    app.post("/api/v1/booking", async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    // add Items
    app.post("/api/v1/addItem", async (req, res) => {
      const product = req.body;
      const result = await foodCollection.insertOne(product);
      res.send(result);
    });
    // add cart
    app.post("/api/v1/cart", gatemen, async (req, res) => {
      const cart = req.body;
      // console.log(cart);
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });
    // cart get
    app.get("/api/v1/cart", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = cartCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // booking
    app.get("/api/v1/booking", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query.email = email;
      }
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    //booking delete start----------------
    app.post("/api/v1/delete_booking", async (req, res) => {
      const ids = req.body.map((id) => new ObjectId(id));
      try {
        const result = await bookingCollection.deleteMany({
          _id: { $in: ids },
        });
        res.json(result);
      } catch (error) {
        console.error("Error deleting items:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // cart delete
    app.delete("/api/v1/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //delete start----------------
    app.post("/api/v1/delete_items", async (req, res) => {
      const ids = req.body.map((id) => new ObjectId(id));
      try {
        const result = await cartCollection.deleteMany({ _id: { $in: ids } });
        res.json(result);
      } catch (error) {
        console.error("Error deleting items:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    app.post("/api/v1/delete_menu", async (req, res) => {
      const ids = req.body.map((id) => new ObjectId(id));
      // console.log("ides", ids);
      try {
        const result = await foodCollection.deleteMany({ _id: { $in: ids } });
        res.json(result);
      } catch (error) {
        // console.error("Error deleting items:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    //delete close--------------
    // food collection
    app.get("/api/v1/food_items", async (req, res) => {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;
      const cursor = foodCollection.find().skip(skip).limit(limit); //cursor point korar jonno
      const result = await cursor.toArray();

      const total = await foodCollection.countDocuments();
      res.send({ total, result });
    });
    // reviews collection
    app.get("/api/v1/reviews", async (req, res) => {
      const cursor = reviewsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
