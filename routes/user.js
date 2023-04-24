const express=require("express");
const User=require("../model/user");
const passport=require("passport");
require("../Config/strategy")(passport);
const mongoose=require("mongoose");
const crypto=require("crypto");
const moment=require("moment");
const multer=require("multer");
const router=express.Router();
const cloudinary=require("cloudinary").v2

router.get("/",(req,res)=>{
    res.render("home");
 
 });
 router.get("/login",(req,res)=>{
     res.render("login");
 });
 
 router.post("/login",(req,res,next)=>{
         try{
          var username=req.body.username;
         var password=req.body.password;
         if(username==='' || username ===null){
             req.flash("error_msg","Enter username");
             res.redirect("/login");
             res.end();
         }
         else if(password==="" || password===null){
             req.flash("error_msg","Password missing");
             res.redirect("/login");
             res.end();
             
         }
         else{
         next();
     }
 }catch(err){
     console.log(err);
 }
 },(req,res,next)=>{
     passport.authenticate('local',{
         successRedirect:'/dashboard',
         failureRedirect:"/login",
         failureFlash:true
     })
     (req,res,next)
 })
 
 router.get("/signup",(req,res)=>{
     res.render("signup");
 })
 router.post("/signup",async(req,res)=>{
     try{
     const {username,password}=req.body;
     if(username==='' || username===null){
         req.flash("error_msg","Username required*");
         res.redirect("/signup");
         return res.end();
     }
     if(password==='' || password===null){
         req.flash("error_msg","Enter a password");
         res.redirect("/signup");
         return res.end();
     }
     await User.findOne({username:username}).then((user)=>{
         if(user){
             req.flash("error_msg","Username already taken");
         res.redirect("/signup");
         return res.end();
         }
         if(!user){
             User.insertMany({username,password}).then((user)=>{
                 if(user){
                     req.flash("success_msg","You are now registered!");
                     res.redirect("/login");
                     return res.end();
                 }
             })
         }
     })
     }
     catch(err){
         console.log(err);
     }
 })


 router.get("/dashboard",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async (req,res)=>{
    try{
   const data=await User.findById(req.user).then((user)=>{
        if(user){
            res.sendStatus=200;
            res.render('dashboard',{
                user:user,
            })
        }
        else{
            res.redirect("/login");
            res.end();
        }
   }).catch(err=>{
    console.log(err);
    res.sendStatus=404;
   //render error template;
   })
}catch(err){
    console.log(err);
    //template render for 500 err;
}
})

//keys generation


router.post("/dashboard/gen_keys",async(req,res)=>{
   try{
    const id=req.user;
    const key=crypto.randomBytes(32);
    console.log(key.length,key);
    await User.findById(id).then(async(user)=>{
           if(user.Key=='' || user.Key=='undefined' || user.Key==null){
            await User.updateOne({_id:id},{Key:key}).then(async(user)=>{
                if(user){
                    res.json(key.toString('hex'));
                   
                }
            })
           }
           else{
            const mykey = Buffer.from(user.Key, 'binary');
            res.json(mykey.toString('hex'));
           }
    }).catch(err=>{
        console.log(err);
    })




    }catch(err){
        console.log(err);
        //template of 500 error;
    }
})

router.get("/dashboard/Create_Post",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
    try{
        var id=req.user;
    await User.findById(id).then((user)=>{
    if(user){
        res.render("create_post",{
            user:user
        })
    }
    else{
        res.json("user not found");
        res.sendStatus=404;
    }
    }).catch(err=>{
        console.log(err);
    
    })
    }catch(err){
        console.log(err);
        //template to be rendered
    }    
})

router.post("/dashboard/Create_Post",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
    try{
    const id=req.user;
    const content=req.body.content;
    const iv=crypto.randomBytes(16);
    await User.findById(id).then(async(user)=>{
        if(user){
        if(user.Key!=undefined){
            const mykey =Buffer.from(user.Key, 'binary');
            const paddedKey =Buffer.alloc(32);
            paddedKey.fill(0, 0, 32 - mykey.length);
            mykey.copy(paddedKey, 32 - mykey.length);
           
            const cipher = crypto.createCipheriv('aes-256-cbc',paddedKey, iv);
            let encrypted = cipher.update(content, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            console.log(encrypted)
            const decipher = crypto.createDecipheriv('aes-256-cbc',paddedKey,iv);
            const dataBuffer = Buffer.from(encrypted, 'hex');
            let decrypted = decipher.update(dataBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            decrypted = decrypted.toString('utf8');
            const currentDate = new Date(); 
            const timezoneOffset = currentDate.getTimezoneOffset();
            const timezoneOffsetMs = timezoneOffset * 60 * 1000;
            const userDate = new Date(currentDate.getTime() - timezoneOffsetMs);
            const options = {hour12: true, year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
   
            const convo = currentDate.toLocaleString('en-US', options);
            const newuserDate = convo.replace('.000', '').replace('T', ' ');
            console.log(decrypted);
            const post={'iv':iv,'content':encrypted.toString("base64"),'decrypted':decrypted,'access':[user.username],"date":newuserDate};
            await User.updateOne({
                _id:user.id
            },{
                $push:{posts:post}
            }).then((user)=>{
                if(user){
                    console.log("pushed successfully");
                    req.flash("success_msg","Posted!");
                    res.redirect("/dashboard/feeds");
                }
            }).catch(err=>{
                console.log(err);
            })
        }
        else{
            res.json("Generate your key!");
            res.end();
        }
    }
    })  




    }
    catch(err){
        console.log(err);
        //template it with err
    }
})

router.get("/dashboard/feeds",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
     try{
        const id=req.user;
        var issuer;
        await User.findById(id).then(async(user)=>{
          if(user){
            issuer=user;
            const cursor = await User.aggregate([
                { $unwind: "$posts" },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        img:1,
                        post: "$posts"

                    },
                },
            ]).cursor({ batchSize: 1000 })
              const posts = await cursor.toArray();
             posts.sort((a, b) =>moment(b.post.date, 'MMMM DD, YYYY [at] h:mm:ss A').toDate() - moment(a.post.date, 'MMMM DD, YYYY [at] h:mm:ss A').toDate());
            //filters

            const new_posts=[];
            posts.forEach(async(post)=>{
              if(post.post.access.includes(user.username)){
                post.post.content=post.post.decrypted;
                post.post.iv=Buffer.from(post.post.iv.buffer,'binary').toString('hex');
                new_posts.push(post);
              }
              else{
                new_posts.push(post);
                
              }
            })

             console.log(new_posts.length);
            res.render("feeds.ejs",{
                user:issuer,
                posts:new_posts
            })
            

     
          }

        }).catch(err=>{
            console.log(err);
        })
       




}
catch(err){
    console.log(err);
}

})


router.post("/decrypt", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash("error_msg", "Please log in");
      res.redirect("/login");
    }
  }, async (req, res) => {
    try {
      var iv = req.body.iv;
      var key = req.body.key;
      var content = req.body.content;
      var add;
      var id = req.user;
      await User.findById(id).then(user => {
        if (user) {
          add = user.username;
        }
      })
      const keyBuffer = Buffer.from(key, 'binary');
      const paddedKey = Buffer.alloc(32);
      const keyLength = Math.min(keyBuffer.length, paddedKey.length);
      keyBuffer.copy(paddedKey, 0, 0, keyLength);
      paddedKey.fill(0, keyLength);
  
      //vector
      const vecBuffer = Buffer.from(iv, 'binary');
      const paddedvec = Buffer.alloc(16);
      const vecLength = Math.min(vecBuffer.length, iv.length);
      vecBuffer.copy(paddedvec, 0, 0, vecLength);
      paddedvec.fill(0, keyLength);
  
      
  
     
      await User.findOne({ "posts.content": content }).then(async (user) => {
        if (user) {
          const ownBuffer = await Buffer.from(user.Key, 'binary');
          const ownKey = await Buffer.alloc(32);
          const ownLength = await Math.min(ownBuffer.length, ownKey.length);
          await ownBuffer.copy(ownKey, 0, 0, ownLength);
          await ownKey.fill(0, ownLength);
          const post = user.posts.find(post => post.content == content && paddedKey.equals(ownKey));
          if (post) {
            User.updateOne(
                { "posts.content": content },
                { $push: { "posts.$.access": add } }
                
              ).then(user=>{
                if(user){
                    console.log(post);
                    res.json(post.decrypted);
                }
                
              }).catch(err=>{
                console.log(err);
            });
          }
          else{
            return Game(res);
          }
        }
    }).catch(err=>{
        console.log(err);
    })
}catch(err){
    console.log(err); 

}
})


async function Game(res){
    
                res.json("user not found");
                res.statusCode=404;
                res.end();
}
router.get("/dashboard/keys",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
    try{
        
        var id=req.user;
       await User.findById(id).then(user=>{
        if(user){
            res.render("keys.ejs",{
                user:user,
            })
        }
       }).catch(err=>{
        console.log(err);
        //template
       })
    
        
    }catch(err){
        console.log(err)
        //template should be rendered
    }
    
})


router.post("/getuser",async(req,res)=>{
    try{
  
       var id=req.user;
       var current_user;
       //user searched
       const user_name=req.body.name;
       //current user
       await User.findById(id).then(user=>{
        if(user){
          current_user=user.username;
          if(current_user==user_name){
            res.json("same");
          } else {
            findUser(user_name, current_user, res);
          }
        }
       })
    }
    catch(err){
        console.log(err);
    }
  })
  
  async function findUser(user_name, current_user, res) {
    try {
      if(user_name=='' || user_name==undefined){
        res.json("user not found");
      } else {
        await User.findOne({username:user_name}).then(user=>{
          if(user){
            if(user.requests.includes(current_user)){
              res.json({name:user_name,"type":"pending",image:user.img});
            } else if(!user.requests.includes(current_user) && !user.appeals.includes(current_user)){
              res.json({name:user_name,"type":"request",image:user.img});
            } else if(!user.requests.includes(current_user) && user.appeals.includes(current_user)){
              res.json({name:user_name,"type":"key accessed",image:user.img});
            }
          } else {
            res.json("user not found");
          }
        })
      }
    } catch (err) {
      console.log(err);
    }
  }

router.post("/requser",async(req,res)=>{
        try{
        var id=req.user;
        
        const username=req.body.user_name;
        if(username=='' || username==undefined){
            res.json("user not found");
            return;
        }
        var current_user;
        await User.findById(id).then((user)=>{
            if(user){
                current_user=user.username;
               if(current_user == username){
                res.status(400).json({ message: 'same' });
                return;
                
               }
            }
        })
        const result = await User.updateOne(
            { username: username},
            { $push: { "requests": current_user } },
            { writeConcern: { w: 'majority' } }
          ).then(user=>{
            if(user){
                res.json("requested");
                return;
            }
          }).catch(err=>{
            console.log(err);
          })
}catch(err){
    console.log(err);
}


})


router.get("/dashboard/requests",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
    try{
        var id=req.user;
    await User.findById(id).then(user=>{
        if(user){
            res.render("requests.ejs",{
              user:user
            })
        }
        else{
            res.statusCode=404;
            res.end();
        }
    }).catch(err=>{
        console.log(err);
    })
        
    }catch(err){
        console.log(err);
    }
   
})

router.post("/reject",async(req,res)=>{
    try{
        console.log("rej")
        const id=req.user
        const name=req.body.name;
    
         await User.updateOne({_id:id},{
            $pull:{requests:name}
         }).then(done=>{
            if(done){
                res.json("rejected");
            }
         }).catch(err=>{
            console.log(err);
         })
     

    }catch(err){
        console.log(err);
    }
})


router.post("/accept", async (req, res) => {
    try {
      const id = req.user;
      const name = req.body.name;
  
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const key = user.Key;
      const current_user=user.username
      await User.updateOne({ _id: id }, { $pull: { requests: name } });
      await User.updateOne({ _id: id }, { $push: { appeals: name } });
      await User.updateOne(
        { username: name },
        { $push: { key_recieves: {current_user,key} } }
      );
  
      res.json("key sent");
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  router.get("/check_req",async(req,res)=>{
    try{
        var id=req.user;
        await User.findById(id).then(user=>{
            if(user){
             res.json(user.requests.length);
            }
        })
    }catch(err){
        console.console.log(err);
    }
})


//setting multer



const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    }
  });
  
  // Configure multer upload
  const upload = multer({ storage: storage });
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: 'di04izpau',
    api_key: '113469129188635',
    api_secret: '8_L3EaRwAmm7YO5bN6JbiZs01Tc'
  });
  
  // Handle image upload
  router.post('/upload_pic', upload.single('image'), async (req, res) => {
    try {
        var id=req.user;
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      console.log("ok");
  
     
           await User.findOneAndUpdate(
                { _id: id },
                { img: result.secure_url },
                { new: true }
              ).then(done=>{
                res.json(result.secure_url );
              })
        

      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });


  const logoutMiddleware = (req, res, next) => {
    req.logout(()=>{
        req.flash("success_msg","Successfully Logged Out")
        res.redirect('/login');
    });
    // Redirect user to login page after logging out
  }



  router.get('/logout', logoutMiddleware);


router.get("/:user",(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        req.flash("error_msg","Please logged in");
        res.redirect("/login");
    }
},async(req,res)=>{
try{
    const username = req.params.user;
    var id=req.user;
    var current_user;
    await User.findById(id).then(user=>{
        if(user){
          current_user=user;
        }
    })
    await User.findOne({username:username}).then(user=>{
        if(user){
            res.render("user",{
                user:user,
                now:current_user
            })
        }
        else{
            res.send("404");

        }
    }).catch(err=>{
        console.log(err);
    })

}catch(err){
    console.log(err);
}
})


  module.exports = router;






