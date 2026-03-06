import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import * as fs from "fs";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_BYTES,
} from "./upload.constants";

@Injectable()
export class UploadService {
  private readonly maxFileSize: number;
  private readonly uploadDir: string;
  private readonly mediaBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.maxFileSize = Number(
      this.configService.get("UPLOAD_MAX_FILE_SIZE") ||
        DEFAULT_MAX_FILE_SIZE_BYTES,
    );
    this.uploadDir =
      this.configService.get("UPLOAD_DIR") || "/app/media/products";
    this.mediaBaseUrl =
      this.configService.get("MEDIA_BASE_URL") ||
      "https://api.exovitaherbal.com/media";

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
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

    const sanitizedName = this.sanitizeBaseFilename(file.originalname);
    const fileName = `${Date.now()}-${randomUUID()}-${sanitizedName}`;

    const targetDir = join(this.uploadDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = join(targetDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `${this.mediaBaseUrl}/products/${fileName}`;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = "products",
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one file is required");
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}
