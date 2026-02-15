import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_BYTES,
} from "./upload.constants";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  private static readonly multerOptions = {
    limits: {
      fileSize: DEFAULT_MAX_FILE_SIZE_BYTES,
    },
    fileFilter: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
        callback(new BadRequestException("Unsupported file type"), false);
        return;
      }

      callback(null, true);
    },
  };

  @Post("single")
  @UseInterceptors(FileInterceptor("file", UploadController.multerOptions))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadFile(file);
    return { url };
  }

  @Post("multiple")
  @UseInterceptors(
    FilesInterceptor("files", 10, UploadController.multerOptions),
  )
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const urls = await this.uploadService.uploadMultipleFiles(files);
    return { urls };
  }
}
