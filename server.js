import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());
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

app.get("/", (req, res) => {
  res.send("<h1>hello world</h1>");
});

app.post("/register", async (req, res) => {
  const { sendRegisterName, sendRegisterEmail, sendRegisterPassword } =
    req.body;
  try {
    const user = await registerModel.findOne({
      registerEmail: sendRegisterEmail,
    });
    if (user) {
      res.status(200).json({ userExist: "user already registered" });
    } else {
      const addRegisterUser = await registerModel.create({
        registerUserName: sendRegisterName,
        registerEmail: sendRegisterEmail,
        registerPassword: sendRegisterPassword,
      });
      res.status(200).json({ register: "register successfully added" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from register endpoint" });
  }
});

app.post("/signin", async (req, res) => {
    const { sendSignInEmail, sendSignInPassword } = req.body;
    try{
        const userExist = await registerModel.findOne({registerEmail: sendSignInEmail})
        if(userExist && userExist.registerPassword === sendSignInPassword){
            res.status(200).json({ signin: "success", signInData: userExist });
        } else if( userExist && userExist.registerPassword !== sendSignInPassword){
            res.status(200).json({ signin: "wrong password" });
        }else{
            res.status(404).json({ signin: "User not found. Try registering." });
        }
    }catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error from signin endpoint" });
  }
})

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


app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
