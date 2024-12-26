const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 5000;
const app = express();

const corsOption = {
    origin: ["http://localhost:5173", "https://assetflow-14.web.app", "https://assetflow-14.netlify.app", "https://assetflow-14.vercel.app", "https://assetflow-server-side.vercel.app"],
    credentials: true,
    optionSuccessStatus: 200,
};         
app.use(cors(corsOption));
app.use(cors());  
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zp5qruk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

async function run() {
    try {
        const UsersCollection = client.db("AssetFlow").collection("users");
        const AssetsCollection = client.db("AssetFlow").collection("Assets");
        const RequestCollection = client.db("AssetFlow").collection("requests");

        app.get("/users", async (req, res) => {
            const result = await UsersCollection.find().toArray();
            res.send(result);
        });

        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const result = await UsersCollection.insertOne(newUser);
            res.send(result);
        });

        // Update employee Affiliate
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedItem = req.body;
            const SingleItem = {
                $set: {
                    affiliateWith: updatedItem.affiliateWith
                }
            };
            const result = await UsersCollection.updateOne(filter, SingleItem, options);
            res.send(result);
        });

        // Asset Section
        app.post("/assets", async (req, res) => {
            const newAsset = req.body;
            const result = await AssetsCollection.insertOne(newAsset);
            res.send(result);
        });

        app.get("/assets", async (req, res) => {
            const result = await AssetsCollection.find().toArray();
            res.send(result);
        });

        app.delete("/assets/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AssetsCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/assets/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedAsset = req.body;
            const SingleItem = {
                $set: {
                    postedBy: updatedAsset.postedBy,
                    addedDate: updatedAsset.addedDate,
                    productName: updatedAsset.productName,
                    productImage: updatedAsset.productImage,
                    productQuantity: updatedAsset.productQuantity,
                    productType: updatedAsset.productType,
                    availability: updatedAsset.availability,
                }
            };
            const result = await AssetsCollection.updateOne(filter, SingleItem, options);
            res.send(result);
        });

        app.put('/assets/decrement/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const result = await AssetsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { productQuantity: -1 } }  // Corrected to decrement
                );

                if (result.modifiedCount > 0) {
                    res.json({ modifiedCount: result.modifiedCount });
                } else {
                    res.json({ modifiedCount: 0 });
                }
            } catch (error) {
                console.error("Error updating Asset:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        app.put('/assets/increment/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const result = await AssetsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { productQuantity: 1 } }
                );

                if (result.modifiedCount > 0) {
                    res.json({ modifiedCount: result.modifiedCount });
                } else {
                    res.json({ modifiedCount: 0 });
                }
            } catch (error) {
                console.error("Error updating Asset:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        // Request Section
        app.get("/requests", async (req, res) => {
            const result = await RequestCollection.find().toArray();
            res.send(result);
        });

        app.post("/requests", async (req, res) => {
            const newRequest = req.body;
            const result = await RequestCollection.insertOne(newRequest);
            res.send(result);
        });

        app.delete("/requests/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await RequestCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/requests/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedRequest = req.body;
            const SingleItem = {
                $set: {
                    status: updatedRequest.status,
                    approvalDate: updatedRequest.approvalDate
                }
            };
            const result = await RequestCollection.updateOne(filter, SingleItem, options);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
          const { amount } = req.body;
        
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount,
              currency: 'usd',
            });
        
            res.send({
              clientSecret: paymentIntent.client_secret,
            });
          } catch (error) {
            res.status(400).send({ error: error.message });
          }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();      
    }                  
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send('Hello from AssetFlow Server.......');
});

app.listen(PORT, () => {
    console.log(`Server is Running on PORT ${PORT}`);
});              
                                                   