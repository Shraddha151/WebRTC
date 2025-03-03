const mongoose = require("mongoose");

const connectDB = async () => {
  try {
<<<<<<< HEAD
    await mongoose.connect("mongodb+srv://shraddhabhat151@gmail.com:<Spbhat151@>@cluster0.3erwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
=======
    await mongoose.connect("mongodb+srv://shraddhab955@gmail.com:<Spbhat151@>@cluster0.3erwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
>>>>>>> ddde41f (Merge remote changes with my local updates)
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
