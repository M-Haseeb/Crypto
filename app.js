const express=require("express");
const crypto = require('crypto');
const flash=require("connect-flash");
const sessions=require("express-session");
const mongoose=require("mongoose");
const passport=require("passport");
const dotenv=require("dotenv");
const ejs=require("ejs");
const path=require("path");
require("./Config/strategy")(passport);


//setting environment
dotenv.config({path:'./config/config.env'});


//setting database
db=require("./Config/db");
db();


//express middlewares

const app=express();
app.use(express.urlencoded({extended:false}));
app.use(express.json());



app.use(express.static("public"));
app.set("view engine","ejs");

app.use(sessions({
    secret:'secrete',
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

//flash messages

app.use(flash());

app.use((req,res,next)=>{
    res.locals.success_msg=req.flash("success_msg");
    res.locals.error_msg=req.flash("error_msg");
    res.locals.err=req.flash("err");
    next();
})

//@routes
app.use("/",require("./routes/user.js"));

const port=process.env.PORT || 5000

app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})
