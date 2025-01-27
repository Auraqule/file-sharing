import { CloudFrontRequestEvent } from "aws-lambda";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

const cwlClient = new CloudWatchLogs({ region: "us-east-1" }); // Lambda@Edge uses us-east-1 for all logs.

const LOG_GROUP_NAME = "/aws/lambda/file-activities";

async function logViewActivity(
  fileName: string,
  userAgent: string | undefined
) {
  const logStreamName = new Date().toISOString().split("T")[0];

  try {
    await cwlClient.putLogEvents({
      logGroupName: LOG_GROUP_NAME,
      logStreamName,
      logEvents: [
        {
          timestamp: Date.now(),
          message: JSON.stringify({
            action: "view",
            fileName,
            userAgent,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ResourceNotFoundException") {
      try {
        await cwlClient.createLogStream({
          logGroupName: LOG_GROUP_NAME,
          logStreamName,
        });
        await logViewActivity(fileName, userAgent);
      } catch (createStreamError) {
        console.error("Failed to create log stream:", createStreamError);
      }
    } else {
      console.error("Failed to log view activity:", error);
    }
  }
}

export const handler = async (event: CloudFrontRequestEvent) => {
  const request = event.Records[0].cf.request;

  const fileName = decodeURIComponent(request.uri.split("/").pop() || "");
  if (!fileName || fileName === "favicon.ico") {
    console.info(`Skipping logging for file: ${fileName}`);
    return request;
  }

  const userAgent = request.headers["user-agent"]?.[0]?.value || "Unknown";

  await logViewActivity(fileName, userAgent);

  return request;
};
