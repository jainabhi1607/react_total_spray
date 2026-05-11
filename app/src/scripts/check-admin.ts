import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb+srv://jainabhi1607_db_user:U4VPy7JES7ZxIXqJ@tsc.o9lonw4.mongodb.net/total_spray_care";
const TEST_EMAIL = "jainabhi1607@gmail.com";
const TEST_PASSWORD = "1234567890";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const users = db.collection("users");

  console.log("DB host:", mongoose.connection.host);
  console.log("DB name:", mongoose.connection.name);
  console.log();

  const exact = await users.findOne({ email: TEST_EMAIL });
  console.log("Exact-case match for", TEST_EMAIL, ":", exact ? "FOUND" : "NOT FOUND");

  const ciMatches = await users
    .find({ email: { $regex: `^${TEST_EMAIL}$`, $options: "i" } })
    .toArray();
  console.log("Case-insensitive matches:", ciMatches.length);
  for (const u of ciMatches) {
    console.log("  -", JSON.stringify({
      _id: u._id.toString(),
      email: u.email,
      role: u.role,
      status: u.status,
      hasPassword: !!u.password,
      passwordPrefix: u.password?.slice(0, 7),
    }));
  }

  if (exact) {
    const ok = await bcrypt.compare(TEST_PASSWORD, exact.password);
    console.log();
    console.log(`bcrypt.compare("${TEST_PASSWORD}", storedHash) =>`, ok);
  }

  await mongoose.disconnect();
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
