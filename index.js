const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.z5oelgm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){

    try{

        await client.connect();
        const toolsCollection = client.db('hardware').collection('tools');
        const orderCollection = client.db('hardware').collection('order');
        const reviewCollection = client.db('hardware').collection('review');
        const userCollection = client.db('hardware').collection('user');
        const profileCollection = client.db('hardware').collection('profile');



    // ======================> TOOLS STAT <========================

        //----> GET ALL TOOLS 
        app.get('/services', async(req, res)=> {
            const filter = {};
            const result = await toolsCollection.find(filter).toArray();
            res.send(result);
        });

        //----> specific tool by id
        app.get('/service/:id', async(req, res)=> {
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await toolsCollection.findOne(filter);
            res.send(result);
        });


    // ======================> TOOLS END <========================




    // ======================> ORDER START <========================

        //==> POST ORDER
        app.post('/order', async(req, res)=> {
            const orderInfo = req.body;
            console.log(orderInfo);
            const result = await orderCollection.insertOne(orderInfo);
            res.send(result);
        });

        //==> GET ALL ORDER FOR USER
        app.get('/order', async(req, res)=> {
            const email = req.query.email;
            const filter = {email: email};
            const result = await orderCollection.find(filter).toArray();
            res.send(result);
        });

        //=> GET ORDER BY USER
        app.delete('/order/:id', async(req, res)=> {
            const id = req.params.id;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

    // ======================> ORDER END <========================






    // ======================> REVIEW START <========================

        //==> POST REVIEW
        app.post('/review', async(req, res)=> {
            const reviewInfo = req.body;
            const result = await reviewCollection.insertOne(reviewInfo);
            res.send(result);
        });

        //==> GET REVIEW
        app.get('/review', async(req, res)=> {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });



    // ======================> REVIEW END <========================


    // ======================> USER START <========================

        //==> CREATE USER BY LOGIN AND REGISTER
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({result, token});
        });

         //==> GET ADMIN
        app.get('/admin/:email', async (req, res)=> {
            const email = req.params.email;
            const filter = {email: email};
            const user = await userCollection.findOne(filter);
            const isAdmin = user?.role === 'admin';
            res.send(isAdmin);
        });

    // ======================> USER END <========================


    // ======================> PROFILE START <========================

        //==> POST PROFILE
        app.put('/profile/:email', async(req, res)=> {
            const email = req.params.email;
            const profileInfo = req.body;
            const filter = {email: email};
            const options = { upsert: true};
            const updateDoc= {
                $set: profileInfo,
            };
            const result = await profileCollection.updateOne(filter, updateDoc, options);
            res.send(result); 
        });

        //==> GET PROFILE_INFO
        app.get('/profile/:email', async (req, res)=> {
            const email = req.params.email;
            const filter = {email: email};
            const result = await profileCollection.findOne(filter);
            res.send(result);
        });


    // ======================> PROFILE END <========================

    }

    finally{}

}
run().catch(console.dir);



app.get('/', (req, res)=> {
    res.send('hardware server is running');
});

app.listen(port, ()=> {
    console.log('Listening port', port);
});


