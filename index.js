const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
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

    app.post("/api/v1/cart", async (req, res) => {
      const cart = req.body;
      console.log(cart);
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
    // cart delete
    app.delete("/api/v1/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //delete
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
    //
    // food collection
    app.get("/api/v1/food_items", async (req, res) => {
      const cursor = foodCollection.find(); //cursor point korar jonno
      const result = await cursor.toArray();
      res.send(result);
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
