const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const mongodb = require("mongodb");
const shortId = require('shortid')
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const app = express();
//const app = express();
app.use(bodyParser.json());
app.use(cors());



const db_url = process.env.db_url;


app.get("/users", async (req, res) => {
    try {
      let client = await mongodb.MongoClient.connect(db_url);
      let db = client.db("studentdb");
      let data = await db.collection("users").find().toArray();
      res.status(200).json(data);
    } catch (error) {
      console.log(error);
    }
  });

  app.post("/register", async (req, res) => {
    try {
        let client = await mongodb.MongoClient.connect(db_url);
        let db = client.db("studentdb");
      let data = await db.collection("users").findOne({ email: req.body.email });
      if (data) {
        res.status(400).json({ message: "user already exists" });
      } else {
        let salt = await bcrypt.genSalt(12);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        let result = await db.collection("users").insertOne(req.body);
        res.status(200).json({ message: "Registered successfully" });
        client.close();
      }
    } catch (err) {
      console.log(err);
    }
  });

  app.post("/login", async (req, res) => {
    try {
        let client = await mongodb.MongoClient.connect(db_url);
        let db = client.db("studentdb");
        let str = randomstring.generate(7);
      let data = await db.collection("users").findOne({ email: req.body.email });
      if (data) {
        let compare = await bcrypt.compare(req.body.password, data.password);
        if (compare) {
          console.log("valid user", compare);
          let token = await jwt.sign(
            { userId: data._id },
            str,
            {
              expiresIn: "1h",
            }
          );
          res.status(200).json({
            status: 200,
            message: "login success",
            msg:token
          });
        } else {
          res.status(403).json({
            status: 403,
            message: "invalid password",
            msg:compare

          });
        }
      } else {
        res.status(401).json({
          status: 401,
          message: "Email is not registered",
        });
      }
      client.close();
    } catch (error) {
      console.log(error);
    }
  });

  app.post("/forget",async(req,res)=>{
    try{
        let client = await mongodb.MongoClient.connect(db_url);
        let db = client.db("studentdb");
        let str = randomstring.generate(7);
        let data = await db.collection("users").updateOne({ email: req.body.email },{$set:{code:str}});
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: 'manoharchunchu1249@gmail.com',
            pass: 'manohar123456'
            }
            });
            
            var mailOptions = {
            from: 'manoharchunchu1249@gmail.com',
            to: req.body.email,
            subject: 'Password Reset',
            text: `click link to reset Password ${str}`,
            html: `<p>secret ${str} code</p><p>Click <a href="https://dazzling-wiles-853ca6.netlify.app/">here</a> to reset your password</p>`,
            };
            
            transporter.sendMail(mailOptions, function(error, info){
            if (error) {
            console.log(error);
            } else {
            console.log('Email sent: ' + info.response);
            
            }
            });
        

    }
    catch(err){
        console.log(error);
    }


  })

  app.post("/reset",async(req,res)=>{
    let client = await mongodb.MongoClient.connect(db_url);
    let db = client.db("studentdb");
    let data = await db.collection("users").findOne({ email: req.body.email });
    if(req.body.code==data.code){
        let salt = await bcrypt.genSalt(12);
        let hash = await bcrypt.hash(req.body.password, salt);
        let data = await db.collection("users").updateOne({ email: req.body.email },{$set:{password:hash}});
        res.status(200).json({message:'password updated'});
    }
    else{
        res.status(400).json({message:'code not matched'})
    }

  })


  app.listen(process.env.PORT || 5000,()=>{
    console.log(dburl);
});
