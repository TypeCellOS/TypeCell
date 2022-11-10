import cp from "child_process";
import path from "path";

const logger = console; // TODO

export async function spawnCmd(
  cmd: string,
  args: string[],
  input?: string,
  opts: cp.SpawnOptions = {},
  log = true
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let basename = path.basename(cmd);
    if (log) {
      logger.log(cmd);
      logger.log(args);
    }
    // opts.cwd = path.dirname(args[0]);
    let child = cp.spawn(cmd, args, opts);
    let result: string = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        try {
          result += chunk.toString();
          if (log) {
            logger.error("[" + basename + ":stdout] " + chunk.toString());
          }
        } catch (e) {
          reject(e);
        }
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        if (log) {
          logger.error("[" + basename + ":stderr] " + chunk.toString());
        }
      });
    }
    child.on("error", (error: any) => {
      if (log) {
        logger.error("[" + basename + "] unhandled error:", error);
      }
      reject(new Error(error));
    });

    child.on("close", (code, signal) => {
      logger.log(
        "[" + basename + "] child process exited with code",
        code,
        "signal",
        signal
      );
      if (signal) {
        reject(
          new Error(
            `Process killed with signal ${signal}, ${cmd} ${args.join(" ")}`
          )
        );
      } else if (code === 0) {
        resolve(result);
      } else {
        reject(
          new Error(
            `Process killed with code ${code}, ${cmd} ${args.join(" ")}`
          )
        );
      }
    });

    if (input) {
      if (!child.stdin) {
        throw new Error("no stdin");
      }
      child.stdin.write(input);
      child.stdin.write("\n");
      child.stdin.end();
    }
  });
}
