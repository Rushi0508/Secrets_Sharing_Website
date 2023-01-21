//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const _ = require('passport-local-mongoose');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: "Our little Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
// Setting Up connection
mongoose.connect('mongodb://localhost:27017/userDB' , {useNewUrlParser: true}).then(()=>{
    console.log("Mongo Connected");
}).catch(err=>{
    console.log("OH error");
    console.log(err);
});

const userSchema =new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// console.log(process.env.API_KEY);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser((user,done)=>{
    done(null, user.id);
});
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ email: profile.emails[0].value, googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req,res)=>{
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile", "email"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/login", (req,res)=>{
    res.render("login");
})
app.get("/register", (req,res)=>{
    res.render("register");
})
app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
        User.find({"secret": {$ne: null}}, (err,foundUsers)=>{
            if(err){
                console.log(err);
            }else{
                if(foundUsers){
                    res.render("secrets", {usersWithSecrets: foundUsers});
                }
            }
        });
    }else{
        res.redirect("/login");
    }
    
});

app.get("/submit" , (req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", (req,res)=>{
    const secret = req.body.secret;
    User.findById(req.user.id, (err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = secret;
                foundUser.save(()=>{
                    res.redirect("/secrets");
                });
            }
        }
    });
})

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { 
        return next(err); 
        }
      res.redirect('/');
    });
});
app.post("/register", (req,res)=>{
    // bcrypt.hash(req.body.password, saltRounds, (err,hash)=>{
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save((err)=>{
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render("secrets");
    //         }
    //     })
    // })
    User.register({username: req.body.username}, req.body.password, (err,user)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            })
        }
    })
});
app.post("/login", (req,res)=>{
    // const username = req.body.username
    // const password = req.body.password;

    // User.findOne({email: username}, (err,user)=>{
    //     if(err){
    //         console.log(err);
    //     }else{
    //         if(user){
    //             // if(user.password ===password){
    //             //     res.render("secrets");
    //             // }
    //             bcrypt.compare(password, user.password, (err,result)=>{
    //                 if(result===true){
    //                     res.render("secrets")
    //                 }
    //             })
    //         }
    //     }
    // })
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })
})





app.listen(3000, ()=>{
    console.log("Server Started");
})