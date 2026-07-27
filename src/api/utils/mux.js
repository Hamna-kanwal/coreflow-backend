const Mux = require('@mux/mux-node');

// Debugging ke liye ye logs add karein
console.log("--- Mux Configuration Check ---");
console.log("Token ID Loaded:", process.env.MUX_TOKEN_ID ? "YES ✅" : "NO ❌");
console.log("Token Secret Loaded:", process.env.MUX_TOKEN_SECRET ? "YES ✅" : "NO ❌");

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

module.exports = mux;