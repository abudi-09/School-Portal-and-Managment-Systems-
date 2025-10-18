// Usage: node scripts/hash-password.js <password> [rounds]
const bcrypt = require("bcryptjs");

async function main() {
  const password = process.argv[2];
  const rounds = parseInt(process.argv[3] || "10", 10);
  if (!password) {
    console.error("Error: Please provide a password to hash");
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, rounds);
    console.log(hash);
  } catch (err) {
    console.error("Hash error:", err);
    process.exit(1);
  }
}

main();
