import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static("public"));
const port = 5000;

mongoose
  .connect("mongodb://127.0.0.1:27017/banao")
  .then(() => {
    console.log("mongodb connect");
  })
  .catch((error) => {
    console.log("mongodb error: ", error);
  });

const registerSchema = new mongoose.Schema({
  registerUserName: {
    type: String,
    required: true,
  },
  registerEmail: {
    type: String,
    unique: true,
    required: true,
  },
  registerPassword: {
    type: String,
    required: true,
  },
});

const registerModel = mongoose.model("register", registerSchema);

const imageSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  comments: [
    {
      accountAdmin: {
        type: String,
      },
      commentText: {
        type: String,
      },
    },
  ],
  likes: [
    {
      adminName: {
        type: String,
        required: true,
      },
      like: {
        type: Boolean,
        required: true,
      },
    },
  ],
});


const imageModel = mongoose.model("imagescollection", imageSchema);

app.get("/", (req, res) => {
  res.send("<h1>hello world</h1>");
});

app.post("/register", async (req, res) => {
  const { sendRegisterName, sendRegisterEmail, sendRegisterPassword } = req.body;
  try {
    const user = await registerModel.findOne({ registerEmail: sendRegisterEmail });
    if (user) {
      res.status(200).json({ userExist: "user already registered" });
    } else {
      const addRegisterUser = await registerModel.create({
        registerUserName: sendRegisterName,
        registerEmail: sendRegisterEmail,
        registerPassword: sendRegisterPassword,
      });
      res.status(200).json({ register: "register successfully added", success: "success", registerData: sendRegisterName });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from register endpoint" });
  }
});

app.post("/signin", async (req, res) => {
  const { sendSignInEmail, sendSignInPassword } = req.body;
  try {
    const userExist = await registerModel.findOne({ registerEmail: sendSignInEmail });
    if (userExist && userExist.registerPassword === sendSignInPassword) {
      res.status(200).json({ signin: "success", signInData: userExist.registerUserName });
    } else if (userExist && userExist.registerPassword !== sendSignInPassword) {
      res.status(200).json({ signin: "wrong password" });
    } else {
      res.status(404).json({ signin: "User not found. Try registering." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from signin endpoint" });
  }
});

app.post("/forget", async (req, res) => {
  const { sendForgetEmail, sendForgetPassword } = req.body;
  try {
    const userExist = await registerModel.findOne({ registerEmail: sendForgetEmail });
    if (userExist) {
      await registerModel.findOneAndUpdate(
        { registerEmail: sendForgetEmail },
        { $set: { registerPassword: sendForgetPassword } }
      );
      res.status(200).json({ forget: "Password changed successfully" });
    } else {
      res.status(404).json({ forget: "User not found. Please check the email." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from forget endpoint" });
  }
});

app.post("/upload", async (req, res) => {
  const { base64 } = req.body;
  try {
    await imageModel.create({ image: base64 });
    res.sendStatus(200);
    return;
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
    return;
  }
});

app.get("/images", async (req, res) => {
  try {
    const images = await imageModel.find();
    res.status(200).json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from images endpoint" });
  }
});

app.post('/comment', async (req, res) => {
  const { accountAdmin, imageId, commentText } = req.body;

  try {
    const imageObjectId = new mongoose.Types.ObjectId(imageId);

    const foundImage = await imageModel.findOne({ _id: imageObjectId });

    if (!foundImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    foundImage.comments.push({
      accountAdmin,
      commentText
    });

    await foundImage.save();
    res.status(200).json({ message: 'Comment added successfully', fetchComments: foundImage.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error from comment endpoint' });
  }
});

app.post('/like', async (req, res) => {
  const { accountAdmin, imageId, likeSend } = req.body;
  try {
    const imageObjectId = new mongoose.Types.ObjectId(imageId);

    const foundImage = await imageModel.findOne({ _id: imageObjectId });

    if (!foundImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const existingLike = foundImage.likes.find(like => like.adminName === accountAdmin);

    if (existingLike) {
      existingLike.like = likeSend;
    } else {
      foundImage.likes.push({
        adminName: accountAdmin,
        like: likeSend,
      });
    }

    await foundImage.save();
    res.status(200).json({ message: 'Like updated successfully', likes: foundImage.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error from like endpoint' });
  }
});

app.delete('/delete/:imageId', async (req, res) => {
  const { imageId } = req.params;

  try {
    const imageObjectId = new mongoose.Types.ObjectId(imageId);
    await imageModel.deleteOne({ _id: imageObjectId });
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error from delete endpoint' });
  }
});


app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
