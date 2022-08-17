const { MongoClient, ServerApiVersion } = require('mongodb');
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
        const toolsCollection = client.db('hardware').collection('tool');

        app.get('/main', async(req, res)=> {
            res.send('hello main page');
        })
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


