Got it! Here's an updated version of the README that includes CloudWatch as the focus instead of SQS and SNS:

````markdown
# CDK TypeScript Project - File Sharing App

Welcome to the **CDK TypeScript Project**! This project demonstrates an AWS CDK application built with TypeScript, which includes the creation of resources like S3 for file storage, Lambda for processing file uploads, CloudWatch for logging file activities, and CloudFront for serving the files.

### Key Components:

- **FileSharingStack**: Defines the infrastructure and services used in the app.
- **S3**: Used for storing files.
- **Lambda**: Processes and logs file activities.
- **CloudWatch**: Logs file upload and view actions.
- **CloudFront**: Provides a CDN to serve uploaded files.

## Project Setup

Follow these instructions to get the project up and running locally:

### Prerequisites

- Install **AWS CDK** globally:
  ```bash
  npm install -g aws-cdk
  ```
````

Verify installation:

```bash
cdk --version
```

- Ensure you have AWS credentials set up on your local environment. You can use the AWS CLI or configure manually:
  ```bash
  aws configure
  ```

### Install Project Dependencies

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### AWS Configuration

Make sure to set your AWS region and account in the `.env` before deploying:

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT=123456789012
```

### CDK Setup

1. Bootstrap your AWS account:

   ```bash
   cdk bootstrap aws://<AWS_ACCOUNT_ID>/<AWS_REGION>
   ```

2. Synthesize the CloudFormation template:

   ```bash
   cdk synth
   ```

3. Deploy the stack: ✅ ensure to build before deploy

   ```bash
   npm run deploy
   ```

4. Destroy the stack (optional):
   ```bash
   cdk destroy
   ```

## API Endpoints

This project exposes an API through API Gateway for performing file operations.

### 1. Obtain a Pre-Signed URL for File Upload

You can generate a pre-signed URL for file upload by making a `GET` request to the following API endpoint:

#### Request:

```bash
curl -X GET "https://x3izbqeyi4.execute-api.us-east-1.amazonaws.com/prod/files/presigned-url?fileName=stock-fish.jpeg" \
-H "x-api-key: file-sharing-api-key-FileSharingStack-1737978920326"
```

#### Sample Response:

```json
{
  "signedUrl": "https://file-sharing-bucket-889541023848-us-east-1.s3.us-east-1.amazonaws.com/stock-fish.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA46HGG3BUGFXLFJYC%2F20250127%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250127T121408Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFUaCXVzLWVhc3QtMSJGMEQCIEFSSc9IdiSjqbtsVkF74Adot7b6Z8uukMhvs9%2B5qV1nAiBmdKndyA3QYybkGX4JLDBh6ZuTGIxn%2B%2F6AS6%2BOIckMoSrFAwhdEAAaDDg4OTU0MTAyMzg0OCIMjUgrVygt5zv7psfMKqIDBqd44VzM447M2ygWHI8IdlZPFQ2i3VwNcJl8O5WOxPYVCXVescew2KjrbAsAomS9AVri%2Bcvs%2FOXdSgKH76A5f7rKYUcK70UY%2FwNwNicZMuFdQfUZ8FY889ThC8c9rvFcQU3CkV5kCuUvWgA6ZfiYY6ZZa4iN%2BFEz6RR%2FnAEvXw%2BqVjJ0bEOgSbCPTUbihxzqhtn4KDpaIpyA9yXQD0uekzEYojgoCHaEHR3aMrQU%2BodQNvQAIGd%2BnYWwIAsfCh4k8DAKmtrDeT3sU6AxvzQsPTvg4rYTGuGC87onCHgcDrrqkronQfcLFFgu%2FiGq6PXxabGyJXDtJVFaRV1l07%2FWsBngRNKcsffI7VC%2F8OXuSEEOQuNo64IbfSIYnlGsUuaY6wmkMcwrkh7e7EI0jzRai0L4NzBNB2ane5T5YdfGV6t5SUEHyi6rjdsUu7ir%2Fh1CbXQWd2oMVCVaWGg4y0OAB9k8WKd7asZf5tzsz%2BdWlbOcloTgfXM%2FtEmKN%2FhDD0H4IdXidsX9qdRw1qdEm1EvKgQJ9V%2FMIlUuKT7jmDLHvzEW8TCP8d28BjqfASBYSVoBVM9kedd7ynq1KM%2F4nOQAkR6bvZqPpyuLNLN1yxIY937FKkq6XI9UsvKrpOgU23UyfKgdNFrYwIo5kR7qR5%2FZ10A96ZJMFPNZQzZ%2Fz3dBgd4bt3ih37p5VLjo7k1rvJHU%2BCRTrwU5AhltUhYRDkKTzMn5iCQR3j5FOGHupsBChV0XIfgnsC8iaOQszJ8vR%2Bxv%2BavMSFzUg%2F0HTQ%3D%3D&X-Amz-Signature=78ed8ea2d09201e832f1c8d5e76f9dc796cf84b74abbb1e366a6e39b9821b6ad&X-Amz-SignedHeaders=host&x-id=PutObject",
  "mediaUrl": "https://d29jn0q6ble5m9.cloudfront.net/stock-fish.jpeg"
}
```

### 2. Upload a File Using the Pre-Signed URL

After obtaining the pre-signed URL, you can upload a file via a `PUT` request:

#### Request:

```bash
curl -X PUT \
-T /path/to/your/file/stock-fish.jpeg \
"https://file-sharing-bucket-889541023848-us-east-1.s3.us-east-1.amazonaws.com/stock-fish.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA46HGG3BUGFXLFJYC%2F20250127%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250127T121408Z&X-Amz-Expires=3600&X-Amz-Security-Token=YOUR_TOKEN&X-Amz-Signature=YOUR_SIGNATURE"
```

Once the upload is successful, the file will be available at the media URL, for example:

[View the uploaded file](https://d29jn0q6ble5m9.cloudfront.net/stock-fish.jpeg)

### 3. View the Uploaded File

To view an uploaded file, you can directly access the file using its URL gottent from mediaUrl of the response gotten from Pre-Signed URL call, for example:

[https://d29jn0q6ble5m9.cloudfront.net/stock-fish.jpeg](https://d29jn0q6ble5m9.cloudfront.net/stock-fish.jpeg)

---

## CloudWatch Logs

This project integrates with **AWS CloudWatch** to log file upload and view events. These logs are automatically created and can be found under the **/aws/lambda/file-activities** log group.

### Sample Log Entries

#### Upload Action:

```json
{
  "action": "upload",
  "fileName": "stock-fish.jpeg",
  "timestamp": "2025-01-27T09:46:53.518Z"
}
```

#### View Action:

```json
{
  "action": "view",
  "fileName": "stock-fish.jpeg",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "timestamp": "2025-01-27T09:47:57.138Z"
}
```

You can access and monitor these logs on the **AWS CloudWatch** console under the /aws/lambda/file-activities log group.

These logs can be viewed and monitored in the AWS CloudWatch Console. You can filter logs by action (e.g., upload or view) and view the details associated with each event, including the file name, timestamp, and user-agent (for views).

Access CloudWatch Logs:
You can access the CloudWatch logs directly via the AWS Console

# CloudWatch Logs Screenshot

[https://d29jn0q6ble5m9.cloudfront.net/cloudwatch-logs.png](https://d29jn0q6ble5m9.cloudfront.net/cloudwatch-logs.png)

---

## Conclusion

This project demonstrates how to manage file uploads and views using AWS services like S3, Lambda, and CloudWatch. The use of pre-signed URLs allows for secure file uploads, and CloudWatch helps monitor the activity in real-time.
