package com.smartcampus.service.ticket;

import com.smartcampus.exception.FileUploadException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES =
        List.of("image/jpeg", "image/png", "image/gif");
    private static final long MAX_SIZE = 5 * 1024 * 1024;

    public String storeFile(MultipartFile file) {
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new FileUploadException(
                "Invalid file type. Only jpg, png, gif allowed.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new FileUploadException(
                "File size exceeds 5MB limit.");
        }
        try {
            String extension = getExtension(file.getOriginalFilename());
            String storedName = UUID.randomUUID().toString() + extension;
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), filePath,
                StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException e) {
            throw new FileUploadException(
                "Failed to store file: " + e.getMessage());
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // non-critical, just log
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}