import * as http from "http";
import autocannon from "autocannon";

export async function createSimpleServer(
  handler: (req: any, res: any) => Promise<void>,
  port = 8080
) {
  const requestListener = async function (req: any, res: any) {
    try {
      await handler(req, res);
      res.writeHead(200);
      res.end("Success!");
    } catch (e) {
      console.log(e);
      res.writeHead(500);
      res.end("Error");
    }
  };

  const server = http.createServer(requestListener);
  server.maxConnections = 10000;
  server.listen(port);
  return server;
}

export async function runAutocannonFromNode(url: string) {
  const result = await autocannon({
    url,
    connections: 10, // default
    pipelining: 1, // default
    duration: 10, // default
  });
  const ret = (autocannon as any).printResult(result, {
    renderLatencyTable: false,
    renderResultsTable: true,
  });
  console.log(ret);
}
