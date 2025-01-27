import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const requiredEnvVars = [
  "AWS_REGION",
  "BUCKET_NAME",
  "LOG_GROUP_NAME",
  "CLOUDFRONT_DOMAIN",
];
// for (const envVar of requiredEnvVars) {
//   if (!process.env[envVar]) {
//     throw new Error(`${envVar} environment variable is required`);
//   }
// }

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const cwlClient = new CloudWatchLogs({ region: process.env.AWS_REGION });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

// ➡️ Helper function to map file extensions to content types
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return types[ext || ""] || "application/octet-stream";
}

// 🟢 Log file activity to CloudWatch
async function logFileActivity(fileName: string, action: "upload") {
  const logStreamName = new Date().toISOString().split("T")[0];

  try {
    await cwlClient.putLogEvents({
      logGroupName: process.env.LOG_GROUP_NAME!,
      logStreamName,
      logEvents: [
        {
          timestamp: Date.now(),
          message: JSON.stringify({
            action,
            fileName,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ResourceNotFoundException") {
      try {
        await cwlClient.createLogStream({
          logGroupName: process.env.LOG_GROUP_NAME ?? "",
          logStreamName,
        });
        await logFileActivity(fileName, action);
      } catch (createStreamError) {
        console.error("Failed to create log stream:", createStreamError);
      }
    } else {
      console.error("Error logging file activity:", error);
    }
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  const fileName = event.queryStringParameters?.fileName;

  if (!fileName) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "fileName is required" }),
    };
  }

  try {
    // 🟢 Prepare S3 PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      ContentType: getContentType(fileName),
    });

    // 🟢 Generate presigned URL
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // 🟢 Log upload activity
    await logFileActivity(fileName, "upload");

    // 🟢 Construct media URL using CloudFront domain
    const mediaUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${fileName}`;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        signedUrl,
        mediaUrl,
      }),
    };
  } catch (error: any) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
      }),
    };
  }
};
