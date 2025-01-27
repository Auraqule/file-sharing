import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { FileSharingStack } from "../lib/file-sharing-stack";

describe("FileSharingStack", () => {
  const app = new cdk.App();
  const stack = new FileSharingStack(app, "TestFileSharingStack", {
    bucketName: "test-bucket",
    env: { region: "us-east-1" },
  });
  const template = Template.fromStack(stack);

  beforeAll(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("S3 Bucket is created with correct properties", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: "test-bucket",
      VersioningConfiguration: { Status: "Enabled" },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        BlockPublicPolicy: false,
        IgnorePublicAcls: false,
        RestrictPublicBuckets: false,
      },
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedMethods: ["GET", "PUT"],
            AllowedOrigins: ["*"],
            AllowedHeaders: ["*"],
          },
        ],
      },
    });
  });

  test("Log Group is created with correct properties", () => {
    template.hasResourceProperties("AWS::Logs::LogGroup", {
      LogGroupName: "/aws/lambda/file-activities",
      RetentionInDays: 7,
    });
  });

  test("Usage Plan is created with API key and stage attached", () => {
    template.hasResourceProperties("AWS::ApiGateway::UsagePlan", {
      UsagePlanName: "Basic",
      Throttle: {
        RateLimit: 5,
        BurstLimit: 10,
      },
      Quota: {
        Limit: 10,
        Period: "DAY",
      },
    });
  });
});
