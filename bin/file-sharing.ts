#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FileSharingStack } from '../lib/file-sharing-stack';

const app = new cdk.App();
new FileSharingStack(app, 'FileSharingStack');
