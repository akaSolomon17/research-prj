import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API server is running at http://localhost:${env.PORT}`);
});
