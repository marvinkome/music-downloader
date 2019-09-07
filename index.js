import express from "express";
import path from "path";
import bodyParser from "body-parser";

const port = process.env.PORT || 7979;

const app = express();

// set view engine
app.set("views", path.join("views"));
app.set("view engine", "ejs");

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set route for static content
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// main routes
app.get("/", (req, res) => res.render("index"));
app.post("/start-downloads", (req, res) => {
    const songs = req.body.songs;
    console.log({ songs });
    res.send("Download startin");
});

// catch 404 and forward to error handler
app.use(function(req, res) {
    res.send("Error 404");
});

// error handler
app.use(function(err, req, res) {
    // render the error page
    res.status(err.status || 500);
    res.sent("Error");
});

app.listen(port, () => {
    console.log(`App is running on port:${port}`);
});
