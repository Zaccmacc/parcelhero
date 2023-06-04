const express = require('express');
const bodyParser = require('body-parser');
const https = require("https");
const mongoose = require('mongoose');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); //to make bodyParser work.
app.use(express.static(__dirname+"/public")); //Static file where CSS and Images go.. files in here will appear in root of html eg.   <link href="css/sign-in.css" rel="stylesheet">
//html part looks like this  <link href="css/sign-in.css" rel="stylesheet"


app.get("/", function(req,res){

    res.render('index', {}) //send params here.
    
});

app.get("/miricollect", function(req,res){

    res.render('miriCollect', {}) //send params here.
    
});

app.get("/bruneicollect", function(req,res){

    res.render('bruneiCollect', {}) //send params here.
    
});


app.listen(process.env.PORT || 3000, function(){
    console.log("server started on port 3000!");
});

