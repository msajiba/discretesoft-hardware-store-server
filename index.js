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

        //==> GET ALL TOOLS 
        app.get('/services', async(req, res)=> {
            const filter = {};
            const result = await toolsCollection.find(filter).toArray();
            res.send(result);
        });

        //==> GET specific service by id
        app.get('/service/:id', async(req, res)=> {
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await toolsCollection.findOne(filter);
            res.send(result);
        });


        //==> POST ORDER
        app.post('/order', async(req, res)=> {
            const orderInfo = req.body;
            console.log(orderInfo);
            const result = await orderCollection.insertOne(orderInfo);
            res.send(result);
        });

        //==> GET ALL USER BASE ORDER
        app.get('/order', async(req, res)=> {
            const email = req.query.email;
            const filter = {email: email};
            const result = await orderCollection.find(filter).toArray();
            res.send(result);
        });

        app.delete('/order/:id', async(req, res)=> {
            const id = req.params.id;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

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


