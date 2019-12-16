const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const Campground = require("./models/campground");
const Comment = require("./models/comment");
const User = require("./models/user");
const seedDB = require("./seeds");


seedDB();
mongoose.connect('mongodb://localhost/yelp_camp', { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
//To set ejs
app.set("view engine", "ejs");
//to use css 
app.use(express.static(__dirname + "/public"));

Campground.find({}, function(err, campgrounds) {
        if(err){
            console.log("No Error");
            console.log(err);
        } else {
            console.log(campgrounds);
        }
    });




    


// Campground.create(
//     {
//     name: "One",
//     image: "https://awe365.com/content/uploads/2013/07/Tibet-trekking-holidays-Flickr-CC-by-McKay-Savage.jpg",
//     description: "This is a great picture",
// }, function (err, campground) { 
//     if(err) {
//         console.log(err);
//     } else {
//         console.log("NEWLY CREATED CAMPGROUD: ");
//         console.log(campground);
//     }

// });
// PASSPORT CONFIGURATION

app.use(require("express-session")({
    secret:"Maksym K",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// How to implement hide and show Login, Sign Up, Logout,
app.use(function(req, res,next){
    res.locals.currentUser = req.user;
    next();
})



app.get("/", function(req, res){
    res.render("landing");
})

//Index routes - show all campgrounds


app.get("/campgrounds", function(req, res){
    req.user
    // Get all campgrounds from DB and render the file
    Campground.find({}, function(err, allCampgrounds){
        if(err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user});
        }
    });
})


//CREATE - add new campground on DB
app.post("/campgrounds", function(req, res) {
    
    //get data from add to campground array
    const name = req.body.name;
    const image = req.body.image;
    const desc = req.body.description;
    const newCamp = {name: name, image: image, description: desc};
    // Create new campground and save to DB
    Campground.create(newCamp, function(err, newlyCreated){
        if(err){
            console.log(err)
        } else {
            //redireck back campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campgroud

app.get("/campgrounds/new", function(req, res) {
    res.render("campgrounds/new");
});

//SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", {camp: foundCampground})
        }
    });
});



//===================
//Comment Routes
//===================

app.get("/campgrounds/:id/comments/new", isLoggenIn, function(req, res){
    //find campground by id 
    Campground.findById(req.params.id, function(err, campground) {
        if(err) {
            console.log(err);
        } else {
            res.render("comments/new", {camp: campground});
        }
    })
})

app.post("/campgrounds/:id/comments", isLoggenIn, function(req, res){
    // lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err) {
            console.log(err)
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err) {
                    console.log(err);
                } else {
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect('/campgrounds/' + campground._id);
                }
            })
        }
    })
    //create new comment
    //connect new comment to campground
    //redirect to campground show page
})

//=====================
//Authorization Routes
//=====================

//show register form
app.get("/register", function(req, res){
    res.render("register")
})

//sign up logic

app.post("/register", function(req, res){
    const newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.render("register")
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("campgrounds");
        })
    });
})

//login form

app.get("/login", function(req, res){
    res.render("login");
})

// handaling login logic

app.post("/login", passport.authenticate("local", 
{
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
}), function(req, res){ 
});

//logout route
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/campgrounds");
})

function isLoggenIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(3000, function(){
    console.log("Connected");
});