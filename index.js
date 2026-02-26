const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URI;

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

    const database = client.db("TrustBridge");
    const userCollection = database.collection("users");

    //register user #########################################
    app.post("/register", async (req, res) => {
      const user = req.body;
      console.log(user);

      const user_email = user.email;
      const existingUser = await userCollection.findOne({ email: user_email });
      if (existingUser) {
        res.send("user already exists");
      } else {
        const result = await userCollection.insertOne(user);
        res.send(result);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
