export interface EnvConfig {
  AWS_ACCOUNT: string;
  AWS_REGION: string;
  BUCKET_NAME: string;
}

export function getEnvConfig(): EnvConfig {
  const awsAccount = process.env.AWS_ACCOUNT || "";
  const awsRegion = process.env.AWS_REGION || "";
  return {
    AWS_ACCOUNT: awsAccount || "",
    AWS_REGION: awsRegion || "",
    BUCKET_NAME: `file-sharing-bucket-${awsAccount}-${awsRegion}`,
  };
}

export function validateEnvConfig(config: EnvConfig): void {
  const missingVars: string[] = [];

  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}
