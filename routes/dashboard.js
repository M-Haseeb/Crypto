const express=require("express").Router;

const router=express();

router.get("/",(req,res)=>{
    res.send("welcome");
})

module.exports=router;