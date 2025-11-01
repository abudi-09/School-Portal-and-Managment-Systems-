#!/usr/bin/env node
/*
  One-off diagnostic script to verify MONGODB_URI connectivity.
  - Resolves SRV records if using mongodb+srv://
  - Attempts a MongoClient connection and runs a ping
  - Prints masked URI and host list; does not reveal credentials

  Usage (PowerShell):
    cd backend
    node .\scripts\check-mongo-connection.js

  Make sure your environment variables are loaded (e.g. create a .env or set MONGODB_URI
  in the hosting environment). This script loads .env automatically via dotenv.
*/

const dns = require("dns");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI environment variable is not set. Aborting.");
  process.exit(2);
}

function maskUri(u) {
  return u.replace(/\/\/([^@]+)@/, "//***:***@");
}

function extractHostPart(u) {
  const afterProto = u.replace(/^.*?:\/\//, "");
  const hostAndRest = afterProto.split("/")[0] || "";
  return hostAndRest.includes("@")
    ? hostAndRest.split("@")[1] || ""
    : hostAndRest;
}

(async () => {
  console.log("=== MongoDB connection diagnostic ===");
  console.log("Masked URI:", maskUri(uri));

  const isSrv = uri.startsWith("mongodb+srv://");
  const hostPart = extractHostPart(uri);

  if (isSrv) {
    console.log(
      `Detected mongodb+srv connection string. Resolving SRV for: ${hostPart}`
    );
    try {
      const records = await new Promise((resolve, reject) =>
        dns.resolveSrv(hostPart, (err, addrs) =>
          err ? reject(err) : resolve(addrs)
        )
      );
      console.log(
        "SRV records:",
        (records || []).map((r) => `${r.name}:${r.port}`)
      );
    } catch (err) {
      console.error(
        "SRV lookup failed:",
        err && err.message ? err.message : err
      );
    }
  } else {
    console.log("Hosts extracted from URI:", hostPart.split(","));
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  console.log("Attempting connection with options:", options);

  const client = new MongoClient(uri, options);
  try {
    await client.connect();
    console.log("Connected to MongoDB. Running ping...");
    const ping = await client.db().admin().ping();
    console.log("Ping response:", ping);
    try {
      // Print some topology info if available
      if (client.topology && client.topology.description) {
        console.log("Topology description:", client.topology.description);
      }
    } catch (e) {
      // ignore
    }
    await client.close();
    console.log("Success: connection and ping completed.");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    try {
      await client.close();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
})();
