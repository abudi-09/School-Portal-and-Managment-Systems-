// Lightweight mock API server (no dependencies) for /api/admin/courses and /api/admin/sections
// Run with: node mock-api-server.js

const http = require("http");
const url = require("url");

const port = process.env.PORT || 5001;

// In-memory stores keyed by grade (9,10,11,12)
const courses = {
  9: [
    {
      id: "c9-1",
      name: "General Mathematics",
      grade: 9,
      isMandatory: true,
      createdAt: new Date().toISOString(),
    },
  ],
  10: [],
  11: [],
  12: [],
};

const sections = {
  9: [
    {
      id: "s9-1",
      label: "STEM A",
      grade: 9,
      capacity: 35,
      createdAt: new Date().toISOString(),
    },
  ],
  10: [],
  11: [],
  12: [],
};

function ensureGrade(grade) {
  if (![9, 10, 11, 12].includes(grade)) return false;
  if (!courses[grade]) courses[grade] = [];
  if (!sections[grade]) sections[grade] = [];
  return true;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", (err) => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "";
  const method = req.method || "GET";

  // GET /api/admin/courses?grade=9
  if (method === "GET" && pathname === "/api/admin/courses") {
    const grade = Number(parsed.query.grade);
    if (!ensureGrade(grade))
      return sendJson(res, 400, { success: false, message: "Invalid grade" });
    return sendJson(res, 200, {
      success: true,
      data: { courses: courses[grade] },
    });
  }

  // POST /api/admin/courses
  if (method === "POST" && pathname === "/api/admin/courses") {
    const body = await parseBody(req);
    const { grade, name, isMandatory } = body;
    const g = Number(grade);
    if (!ensureGrade(g))
      return sendJson(res, 400, { success: false, message: "Invalid grade" });
    if (!name || typeof name !== "string" || !name.trim())
      return sendJson(res, 400, {
        success: false,
        message: "Name is required",
      });
    const id = `c${g}-${Date.now()}`;
    const item = {
      id,
      name: name.trim(),
      grade: g,
      isMandatory: !!isMandatory,
      createdAt: new Date().toISOString(),
    };
    courses[g].push(item);
    return sendJson(res, 201, { success: true, data: { course: item } });
  }

  // GET /api/admin/sections?grade=9
  if (method === "GET" && pathname === "/api/admin/sections") {
    const grade = Number(parsed.query.grade);
    if (!ensureGrade(grade))
      return sendJson(res, 400, { success: false, message: "Invalid grade" });
    return sendJson(res, 200, {
      success: true,
      data: { sections: sections[grade] },
    });
  }

  // POST /api/admin/sections
  if (method === "POST" && pathname === "/api/admin/sections") {
    const body = await parseBody(req);
    const { grade, label, capacity } = body;
    const g = Number(grade);
    if (!ensureGrade(g))
      return sendJson(res, 400, { success: false, message: "Invalid grade" });
    if (!label || typeof label !== "string" || !label.trim())
      return sendJson(res, 400, {
        success: false,
        message: "Label is required",
      });
    const id = `s${g}-${Date.now()}`;
    const item = {
      id,
      label: label.trim(),
      grade: g,
      capacity: capacity ? Number(capacity) : undefined,
      createdAt: new Date().toISOString(),
    };
    sections[g].push(item);
    return sendJson(res, 201, { success: true, data: { section: item } });
  }

  // Default 404
  sendJson(res, 404, { success: false, message: "Not found" });
});

server.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
});
