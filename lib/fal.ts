import { fal } from "@fal-ai/client";

// Configure fal client with server-side credentials
// FAL_KEY environment variable is automatically picked up by the client
fal.config({
  credentials: process.env.FAL_KEY,
});

export { fal };
