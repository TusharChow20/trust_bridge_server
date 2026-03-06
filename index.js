const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 4000;
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
// Middleware
app.use(cors());
app.use(express.json());
//cloudinary store
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
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
    const productCollection = database.collection("allProducts");

    //register user #########################################
    app.post("/register", async (req, res) => {
      const user = req.body;
      // console.log(user);

      //salt
      const salt = bcrypt.genSaltSync(10);

      const user_email = user.email;
      const existingUser = await userCollection.findOne({ email: user_email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const hashedPassword = bcrypt.hashSync(user.password, salt);

        const result = await userCollection.insertOne({
          name: user.name,
          email: user_email,
          password: hashedPassword,
          role: "user",
        });
        res.send(result);
      }
    });

    //login user ##############################################
    app.post("/login", async (req, res) => {
      const user = req.body;
      const findUser = await userCollection.findOne({
        email: user.email,
      });
      if (!findUser) {
        return res.status(404).send({ message: "User not found" });
      }
      const passwordsMatch = bcrypt.compareSync(
        user.password,
        findUser.password,
      );
      if (!passwordsMatch) {
        return res.status(401).send({ message: "Wrong password" });
      }

      res.send({
        _id: findUser._id,
        name: findUser.name,
        email: findUser.email,
      });
    });
    //all get products==================###############################
    app.get("/allProducts", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    //all products ==================###############################
    app.post("/allProducts", async (req, res) => {
      const data = req.body;

      const result = await productCollection.insertOne({
        ...data,
        createdAt: new Date(),
      });

      res.send(result);
    });
    //upload to cloudinary*******************************
    app.post("/upload", upload.single("image"), async (req, res) => {
      try {
        const file = req.file;

        if (!file) {
          return res.status(400).send({ message: "No file uploaded" });
        }

        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "trustbridge_products",
          },
        );

        res.send({
          imageUrl: result.secure_url,
        });
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Upload failed" });
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
