import { type RequestHandler } from "@qwik.dev/router";
import fs from "fs";
import path from "path";

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const { features } = body;

    const filePath = path.join(process.cwd(), "public", "features.json");
    fs.writeFileSync(filePath, JSON.stringify({ features }, null, 2));

    json(200, { success: true });
  } catch (error) {
    json(500, { success: false, error: String(error) });
  }
};
