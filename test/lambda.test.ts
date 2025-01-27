import { handler } from "../lambda/index";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudWatchLogs,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Set the AWS region explicitly
process.env.AWS_REGION = "us-east-1";

// Mock AWS SDK clients
const s3Mock = mockClient(S3Client);
const cwlMock = mockClient(CloudWatchLogs);

describe("Lambda Handler", () => {
  beforeEach(() => {
    s3Mock.reset();
    cwlMock.reset();

    process.env.AWS_REGION = "us-east-1";
    process.env.BUCKET_NAME = "test-bucket";
    process.env.LOG_GROUP_NAME = "test-log-group";
    process.env.CLOUDFRONT_DOMAIN = "test-cloudfront-domain";
  });

  it("should return a presigned URL and media URL for a valid fileName", async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    cwlMock.on(PutLogEventsCommand).resolves({});

    const event: APIGatewayProxyEvent = {
      httpMethod: "GET",
      queryStringParameters: {
        fileName: "test.jpg",
      },
    } as unknown as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      signedUrl: expect.any(String),
      mediaUrl: "https://test-cloudfront-domain/test.jpg",
    });
  });

  it("should return a 400 error if fileName is missing", async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: "GET",
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: "fileName is required",
    });
  });

  it("should handle CloudWatch Logs errors gracefully", async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    cwlMock.on(PutLogEventsCommand).rejects(new Error("CloudWatch Error"));

    const event: APIGatewayProxyEvent = {
      httpMethod: "GET",
      queryStringParameters: {
        fileName: "test.jpg",
      },
    } as unknown as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      signedUrl: expect.any(String),
      mediaUrl: "https://test-cloudfront-domain/test.jpg",
    });
  });

  it("should handle OPTIONS requests for CORS", async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: "OPTIONS",
    } as unknown as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe("");
    expect(result.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    });
  });
});
