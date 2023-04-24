const mongoose=require("mongoose");

const db= async()=>{

    try{
        const database=await mongoose.connect("mongodb+srv://1_haseeb:megasxlrrobo@cluster0.ntjml.mongodb.net/?retryWrites=true&w=majority");
        console.log("Database Connected");
    }
    catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports=db;
