// pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner --filter @finmy/lib
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function uploadToR2(
  client: S3Client,
  bucketName: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getR2SignedUrl(
  client: S3Client,
  bucketName: string,
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucketName, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}
