import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import authRoute from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { fileURLToPath } from "url";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";

/*****************
 * CONFIGURATIONS
 *****************/

/** Middleware is pre-built software components that can be added
 * to the framework's request/response processing pipeline,
 * to handle tasks such as database access. */

// decodes the file URL to a path string and ensures that the URL control
const __filename = fileURLToPath(import.meta.url);

// environment variable that tells you the absolute path
// of the directory containing the currently executing file.
const __dirname = path.dirname(__filename);

// Dotenv is a zero-dependency module that loads environment
// variables from a .env file into process.env.
dotenv.config();
const app = express();
app.use(express.json());

// Helmet helps secure Express apps by setting HTTP response headers.
app.use(helmet());

//  Blocks others from loading your resources cross-origin
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Morgan is an HTTP request level Middleware. It is a great tool that logs the requests
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// CORS is a browser security feature that restricts cross-origin HTTP requests with
// other servers and specifies which domains access your resources.
app.use(cors());

// set director of where we keep our image asset (locally)
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/****************
 *  FILE STORAGE
 * **************/

// Returns a Multer instance that provides several
// methods for generating middleware that process files
// uploaded in multipart/form-data format.
// in other word this will allow us to save files to assets folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

/** ROUTES WITH FILES */

// go to route save picture in public/assets [middleware] before registering/saving user
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/** ROUTES */
app.use("/auth", authRoute);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/*****************
 * MONGOOSE SETUP
 *****************/
const PORT = process.env.PORT || 6001;

// connect to DB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));
