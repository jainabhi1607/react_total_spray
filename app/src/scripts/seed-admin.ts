import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb+srv://jainabhi1607_db_user:U4VPy7JES7ZxIXqJ@tsc.o9lonw4.mongodb.net/total_spray_care";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db!;
    const usersCollection = db.collection("users");
    const userDetailsCollection = db.collection("userdetails");

    // Check if user already exists
    const existing = await usersCollection.findOne({ email: "jainabhi1607@gmail.com" });
    if (existing) {
      console.log("Admin user already exists, updating password...");
      const hashedPassword = await bcrypt.hash("1234567890", 10);
      await usersCollection.updateOne(
        { email: "jainabhi1607@gmail.com" },
        { $set: { password: hashedPassword, role: 1, status: 1, name: "Abhishek", lastName: "Jain" } }
      );
      console.log("Admin user updated!");
    } else {
      const hashedPassword = await bcrypt.hash("1234567890", 10);
      const result = await usersCollection.insertOne({
        name: "Abhishek",
        lastName: "Jain",
        email: "jainabhi1607@gmail.com",
        password: hashedPassword,
        role: 1,
        status: 1,
        phone: "",
        position: "Super Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await userDetailsCollection.insertOne({
        userId: result.insertedId,
        profilePic: "",
        twoFactorAuth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Admin user created successfully!");
      console.log("User ID:", result.insertedId.toString());
    }

    console.log("\nLogin credentials:");
    console.log("Email: jainabhi1607@gmail.com");
    console.log("Password: 1234567890");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

seedAdmin();
