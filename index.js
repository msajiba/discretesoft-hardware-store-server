const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json());



const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
       return res.status(401).send({message: 'UnAuthorization'});
    };
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        if(err){
          return res.status(403).send({message: 'Forbidden'});
        }
        req.decoded = decoded;
        next();
    });

}




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


        const verifyAdmin = async(req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
                next();
            }
            else{
                return res.status(403).send({message: 'Forbidden'})
            };
        }




    // ======================> TOOLS STAT <========================

        //----> GET ALL TOOLS 
        app.get('/services', async(req, res)=> {
            const filter = {};
            const result = await toolsCollection.find(filter).toArray();
            res.send(result);
        });

        //==> PRODUCT DELETE BY USER
        app.delete('/product/:id', verifyJWT, verifyAdmin,  async(req, res)=> {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await toolsCollection.deleteOne(filter);
            res.send(result);
        })

        //----> specific tool by id
        app.get('/service/:id', async(req, res)=> {
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await toolsCollection.findOne(filter);
            res.send(result);
        });

        //----> POST A TOOLS / PRODUCT
        app.post('/product', verifyJWT, verifyAdmin, async(req, res)=> {
            const productInfo = req.body;
            const result = await toolsCollection.insertOne(productInfo);
            res.send(result);
        })


    // ======================> TOOLS END <========================






    // ======================> ORDER START <========================

        //==> POST ORDER
        app.post('/order',  async(req, res)=> {
            const orderInfo = req.body;
            const result = await orderCollection.insertOne(orderInfo);
            res.send(result);
        });

        //==> GET A ORDER FOR PAYMENT
        app.get('/orderService/:id', verifyJWT, async (req, res)=> {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await orderCollection.findOne(filter);
            res.send(result);
        })

        //==> GET ALL ORDER FOR USER
        app.get('/order/:email', verifyJWT, async(req, res)=> {
            const email = req.params.email;
            const filter = {email: email};
            const result = await orderCollection.find(filter).toArray();
            res.send(result);
        });


        //=> DELETE ORDER BY USER
        app.delete('/order/:id', verifyJWT, async(req, res)=> {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

        //----> GET ALL ORDER FOR admin
        app.get('/allOrder', verifyJWT, verifyAdmin,async(req, res)=> {
            const email = req.query.email;
            const decodeEmail = req.decoded.email;

            if(email=== decodeEmail){
                const orders = await orderCollection.find().toArray();
               return res.send(orders);
            }
            else{
               return res.status(403).send({message: 'Forbidden'})
            }
          
            
        });


    // ======================> ORDER END <========================






    // ======================> REVIEW START <========================

        //==> POST REVIEW
        app.post('/review', verifyJWT, async(req, res)=> {
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

        //==> MAKE ADMIN
       app.put('/user/admin/:email', verifyJWT, verifyAdmin,  async (req, res)=> {
            const email = req.params.email;
            const filter = {email: email};
            const updateDoc = { 
                $set: {role:'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
       });



    // ======================> USER END <========================


    // ======================> PROFILE START <========================

        //==> POST PROFILE
        app.put('/profile/:email', verifyJWT, async(req, res)=> {
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
        app.get('/profile/:email', verifyJWT, async (req, res)=> {
            const email = req.params.email;
            const filter = {email: email};
            const result = await profileCollection.findOne(filter);
            res.send(result);
        });


    // ======================> PROFILE END <========================


    // ======================> PAYMENT START <========================

        // app.post('/create-payment-intent', async(req, res)=> {
        //     const {totalPrice} = req.body;
        //     const amount = totalPrice *100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: "usd",
        //         automatic_payment_methods: {
        //             enabled: true,
        //         },
        //     });
        //     res.send({clientSecret: paymentIntent.client_secret})
        // });

    // ======================> PAYMENT END <========================

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


