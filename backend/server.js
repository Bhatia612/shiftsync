const app = require("./src/app.js");

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`ShiftSync API listening on port ${PORT}`);
});