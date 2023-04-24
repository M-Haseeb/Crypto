const local_strategy=require("passport-local").Strategy;
const mongoose=require("mongoose");
const User=require("../model/user");
const passport=require("passport");

module.exports= (passport)=>{
    passport.use(new local_strategy({
              usernameField:'username'
    },(username,password,done)=>{
             User.findOne({username:username}).then((user)=>{
                 if(!user)
                 return done(null,false,{type:'error_msg',message:"user not found"});
                 if(user){
                     if(password===user.password){
                         return done(null,user)
                     }
                     else{
                         
                         return done(null,false,{type:'error_msg',message:"Password incorrect"})
                     }
                 }
             }).catch(err=>{
                 console.log(err);
             })
    })
    
    
    
    )

//Serialize

passport.serializeUser((user,done)=>{
    done(null,user.id);
});


//Deserialize
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


}
    