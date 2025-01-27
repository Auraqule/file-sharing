import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

interface FileSharingStackProps extends cdk.StackProps {
  bucketName: string;
}

export class FileSharingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FileSharingStackProps) {
    super(scope, id, props);

    const apiKey =
      this.node.tryGetContext("apiKey") ||
      `file-sharing-api-key-${cdk.Names.uniqueId(this)}-${Date.now()}`;

    const bucket = new s3.Bucket(this, "FileSharingBucket", {
      bucketName: props.bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        principals: [new iam.AnyPrincipal()],
        resources: [bucket.arnForObjects("*")],
      })
    );

    const fileActivityLog = new logs.LogGroup(this, "FileActivityLog", {
      logGroupName: "/aws/lambda/file-activities",
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const viewLoggerFunction = new cloudfront.experimental.EdgeFunction(
      this,
      "ViewLogger",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "view-logger.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        edgeLambdas: [
          {
            functionVersion: viewLoggerFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          },
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    const presignedUrlLambda = new lambda.Function(this, "PresignedUrlLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("dist/lambda"),
      environment: {
        BUCKET_NAME: props.bucketName,
        LOG_GROUP_NAME: fileActivityLog.logGroupName,
        CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
      },
    });

    bucket.grantReadWrite(presignedUrlLambda);

    presignedUrlLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
        ],
        resources: [fileActivityLog.logGroupArn + ":*"],
      })
    );

    const api = new apigateway.RestApi(this, "FileSharingApi", {
      restApiName: "File Sharing Service",
      description: "File sharing service with upload and view tracking",
    });

    const apiKeyResource = api.addApiKey("FileSharingApiKey", {
      value: apiKey,
    });

    const plan = api.addUsagePlan("FileSharingUsagePlan", {
      name: "Basic",
      throttle: {
        rateLimit: 5,
        burstLimit: 10,
      },
      quota: {
        limit: 10,
        period: apigateway.Period.DAY,
      },
    });

    plan.addApiStage({
      stage: api.deploymentStage,
    });
    plan.addApiKey(apiKeyResource);

    const filesResource = api.root.addResource("files");
    const presignedUrl = filesResource.addResource("presigned-url");

    presignedUrl.addMethod(
      "GET",
      new apigateway.LambdaIntegration(presignedUrlLambda),
      {
        apiKeyRequired: true,
      }
    );

    new cdk.CfnOutput(this, "ApiKey", {
      value: apiKey,
      description: "API Key for accessing the File Sharing Service",
    });
    new cdk.CfnOutput(this, "BucketName", {
      value: props.bucketName,
      description: "Name of the S3 bucket for file storage",
    });
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "URL of the API Gateway endpoint",
    });
    new cdk.CfnOutput(this, "CloudFrontDomain", {
      value: distribution.distributionDomainName,
      description: "CloudFront domain for accessing media files",
    });
  }
}
