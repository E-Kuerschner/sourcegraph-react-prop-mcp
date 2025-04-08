import { promisify } from "util";
import { exec as execCallback, spawn } from "child_process";
import path from "path";

const exec = promisify(execCallback);

/**
 * Execute a src-cli command and return the output
 */
export async function executeSrcCommand(
  command: string,
  args: string[] = [],
): Promise<string> {
  try {
    // Check if src-cli is available
    await exec(
      `${path.resolve(__dirname, "../")}/node_modules/.bin/src version`,
    );
  } catch (error) {
    throw new Error(
      `src-cli is not installed or not in PATH. Please install it first. Exec path: ${path.resolve(__dirname, "../")}/node_modules/.bin/src version`,
    );
  }

  return new Promise((resolve, reject) => {
    // Sourcegraph API key from environment variable
    const SRC_ACCESS_TOKEN = process.env.SRC_ACCESS_TOKEN;
    // Sourcegraph endpoint, default to sourcegraph.com if not specified
    const SRC_ENDPOINT = process.env.SRC_ENDPOINT || "https://sourcegraph.com";

    // Create environment for the command with API key
    const env = {
      ...process.env,
      SRC_ACCESS_TOKEN,
      SRC_ENDPOINT,
    };

    // Construct the full command array
    const fullCommand = [command, ...args];

    // For debugging
    console.error(`Executing: src ${fullCommand.join(" ")}`);

    // Spawn the src-cli process
    const srcProcess = spawn(
      `${path.resolve(__dirname, "../")}/node_modules/.bin/src`,
      fullCommand,
      { env },
    );

    let stdout = "";
    let stderr = "";

    srcProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    srcProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    srcProcess.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(`src-cli command failed with code ${code}: ${stderr}`),
        );
      }
    });

    srcProcess.on("error", (error) => {
      reject(new Error(`Failed to execute src-cli: ${error.message}`));
    });
  });
}

/**
 * Test Sourcegraph connection and return version information
 */
export async function testConnection(): Promise<string> {
  return executeSrcCommand("version");
}
