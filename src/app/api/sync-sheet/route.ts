import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST() {
  return new Promise<Response>((resolve) => {
    exec("npm run sync:sheet", (error, stdout, stderr) => {
      if (error) {
        console.error("Sheet sync failed:", error);

        resolve(
          NextResponse.json(
            {
              success: false,
              error: stderr || error.message,
            },
            { status: 500 }
          )
        );

        return;
      }

      console.log(stdout);

      resolve(
        NextResponse.json({
          success: true,
          message: "Google Sheet synced successfully",
          output: stdout,
        })
      );
    });
  });
}