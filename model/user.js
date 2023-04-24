const mongoose=require("mongoose");

const user_schema=mongoose.Schema({

  username:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  img:{
    type:String
  },
  Key:{
    type:String,
  },

requests:{
    type:Array,
    default:[]
},
appeals:{
  type:Array,
  default:[]
},
key_recieves:{
    type:Array,
    default:[]
},
posts:{ 
    type:Array,
    default:[]
}

})

const User=mongoose.model('tweet_user',user_schema);
module.exports=User;