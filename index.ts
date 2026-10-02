// Example: generate a video with Seedance 2.5 via the Higgsfield SDK.
// Run with `npm run higgsfield:example`. Requires HF_CREDENTIALS="key-id:key-secret" in .env.local.
import { config as loadEnv } from "dotenv";
import { createHiggsfieldClient, TimeoutError } from "@higgsfield/client/v2";

loadEnv({ path: ".env.local", quiet: true });

const MODEL = "bytedance/seedance-2.5/text-to-video";

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials) {
    console.error("HF_CREDENTIALS is not set. Add it to .env.local as key-id:key-secret.");
    return 1;
  }

  const client = createHiggsfieldClient({
    credentials,
    // Video generation can take longer than the SDK's 5-minute default.
    maxPollTime: 15 * 60 * 1000,
  });

  let response;
  try {
    response = await client.subscribe(MODEL, {
      input: {
        prompt: "A cinematic scene at sunset",
        duration: 5,
        resolution: "720p",
        aspect_ratio: "16:9",
      },
      withPolling: true,
    });
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error("Timed out waiting for the generation to finish.");
    } else {
      console.error("Request failed:", error instanceof Error ? error.message : error);
    }
    return 1;
  }

  // The SDK stops polling on completed, failed, or nsfw; treat anything other
  // than completed-with-a-URL (including canceled) as a failure.
  const status = response.status as string;
  switch (status) {
    case "completed": {
      const url = response.video?.url;
      if (!url) {
        console.error(`Request ${response.request_id} completed but returned no video URL.`);
        return 1;
      }
      console.log(url);
      return 0;
    }
    case "nsfw":
      console.error(`Request ${response.request_id} was rejected by moderation.`);
      return 1;
    case "failed":
      console.error(`Request ${response.request_id} failed.`);
      return 1;
    case "canceled":
    case "cancelled":
      console.error(`Request ${response.request_id} was canceled.`);
      return 1;
    default:
      console.error(`Request ${response.request_id} ended with unexpected status "${status}".`);
      return 1;
  }
}

main().then((code) => {
  process.exitCode = code;
});
