package com.ohmybaby.infra.storage

import com.ohmybaby.common.exception.FileUploadException
import io.minio.*
import io.minio.http.Method
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream
import java.util.*
import java.util.concurrent.TimeUnit

@Service
class MinioStorageService(
    private val minioClient: MinioClient,
    @Value("\${minio.bucket-name}")
    private val bucketName: String
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun uploadFile(file: MultipartFile, folder: String): String {
        try {
            ensureBucketExists()
            
            val extension = file.originalFilename?.substringAfterLast('.', "") ?: ""
            val fileName = "${UUID.randomUUID()}.$extension"
            val objectName = "$folder/$fileName"
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .`object`(objectName)
                    .stream(file.inputStream, file.size, -1)
                    .contentType(file.contentType ?: "application/octet-stream")
                    .build()
            )
            
            logger.info("File uploaded successfully: $objectName")
            return objectName
        } catch (e: Exception) {
            logger.error("Failed to upload file: ${file.originalFilename}", e)
            throw FileUploadException("Failed to upload file: ${e.message}")
        }
    }

    fun getFile(objectName: String): InputStream {
        return minioClient.getObject(
            GetObjectArgs.builder()
                .bucket(bucketName)
                .`object`(objectName)
                .build()
        )
    }

    fun getPresignedUrl(objectName: String, expiryMinutes: Int = 60): String {
        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .bucket(bucketName)
                .`object`(objectName)
                .method(Method.GET)
                .expiry(expiryMinutes, TimeUnit.MINUTES)
                .build()
        )
    }

    fun deleteFile(objectName: String) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .`object`(objectName)
                    .build()
            )
            logger.info("File deleted successfully: $objectName")
        } catch (e: Exception) {
            logger.error("Failed to delete file: $objectName", e)
            throw FileUploadException("Failed to delete file: ${e.message}")
        }
    }

    private fun ensureBucketExists() {
        val exists = minioClient.bucketExists(
            BucketExistsArgs.builder()
                .bucket(bucketName)
                .build()
        )
        
        if (!exists) {
            minioClient.makeBucket(
                MakeBucketArgs.builder()
                    .bucket(bucketName)
                    .build()
            )
            logger.info("Bucket created: $bucketName")
        }
    }
}
