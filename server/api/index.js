const { handle } = require("hono/vercel");
const app = require("../dist/app.js").default;

const runtime = "nodejs";

module.exports = handle(app);
module.exports.runtime = runtime;
