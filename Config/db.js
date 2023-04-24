const mongoose=require("mongoose");

const db= async()=>{

    try{
        const database=await mongoose.connect(process.env.MongoUri);
        console.log("Database Connected");
    }
    catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports=db;