#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FileSharingStack } from "../lib/file-sharing-stack";
import { getEnvConfig, validateEnvConfig } from "../config/env";
import * as dotenv from "dotenv";

// 🟢 Load .env variables
dotenv.config();

// 🟢 Get and validate environment variables
const config = getEnvConfig();
validateEnvConfig(config);

const app = new cdk.App();

new FileSharingStack(app, "FileSharingStack", {
  env: {
    account: config.AWS_ACCOUNT,
    region: config.AWS_REGION,
  },
  bucketName: config.BUCKET_NAME,
});
