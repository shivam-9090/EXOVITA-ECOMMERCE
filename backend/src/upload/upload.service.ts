import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as AWS from "aws-sdk";
import { extname } from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_BYTES,
} from "./upload.constants";

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private readonly maxFileSize: number;
  private readonly acl: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
      secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
      region: this.configService.get("AWS_REGION"),
    });

    this.maxFileSize = Number(
      this.configService.get("UPLOAD_MAX_FILE_SIZE") ||
        DEFAULT_MAX_FILE_SIZE_BYTES,
    );
    this.acl = this.configService.get("AWS_S3_ACL") || "public-read";
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }

    const extension = extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      throw new BadRequestException("Unsupported file extension");
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException("File size exceeds allowed limit");
    }
  }

  private sanitizeBaseFilename(originalName: string) {
    const extension = extname(originalName || "").toLowerCase();
    const baseName = (originalName || "file")
      .replace(extension, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    return `${baseName || "file"}${extension || ".bin"}`;
  }

  async uploadFile(file: Express.Multer.File, folder: string = "products") {
    this.validateFile(file);

    const bucket = this.configService.get("AWS_S3_BUCKET");
    if (!bucket) {
      throw new InternalServerErrorException("Upload bucket is not configured");
    }

    const sanitizedName = this.sanitizeBaseFilename(file.originalname);
    const fileName = `${folder}/${Date.now()}-${randomUUID()}-${sanitizedName}`;

    const params = {
      Bucket: bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: this.acl,
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: {
        uploadedBy: "exovita-api",
      },
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = "products",
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one file is required");
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}
