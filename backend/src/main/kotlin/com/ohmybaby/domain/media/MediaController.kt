package com.ohmybaby.domain.media

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.UserPrincipal
import com.ohmybaby.domain.media.dto.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime
import java.util.*

@Tag(name = "Media", description = "미디어 API")
@RestController
@RequestMapping("/api/media")
class MediaController(
    private val mediaService: MediaService
) {

    @Operation(summary = "미디어 업로드 (단일)")
    @PostMapping("/upload", consumes = [org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasRole('PARENT')")
    fun uploadMedia(
        @RequestPart("file") file: MultipartFile,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<MediaUploadResponse>> {
        val response = mediaService.uploadFile(file, principal.id)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(response))
    }

    @Operation(summary = "미디어 업로드 (다중)")
    @PostMapping("/upload/bulk", consumes = [org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasRole('PARENT')")
    fun uploadMediaBulk(
        @RequestPart("files") files: List<MultipartFile>,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<BulkUploadResponse>> {
        val response = mediaService.uploadFiles(files, principal.id)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(response))
    }

    @Operation(summary = "미디어 목록 조회")
    @GetMapping
    fun getMediaList(
        @Parameter(description = "미디어 타입 필터 (PHOTO, VIDEO)")
        @RequestParam(required = false) type: MediaType?,
        @Parameter(description = "시작 날짜")
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        startDate: LocalDateTime?,
        @Parameter(description = "종료 날짜")
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        endDate: LocalDateTime?,
        @Parameter(description = "페이지 번호 (0부터 시작)")
        @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "페이지 크기")
        @RequestParam(defaultValue = "20") size: Int,
        @AuthenticationPrincipal principal: UserPrincipal?
    ): ResponseEntity<ApiResponse<MediaListResponse>> {
        val filter = MediaFilterRequest(
            type = type,
            startDate = startDate,
            endDate = endDate,
            page = page,
            size = size
        )
        val response = mediaService.getMediaList(filter, principal?.id)
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @Operation(summary = "미디어 상세 조회")
    @GetMapping("/{id}")
    fun getMedia(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: UserPrincipal?
    ): ResponseEntity<ApiResponse<MediaResponse>> {
        val response = mediaService.getMedia(id, principal?.id)
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @Operation(summary = "미디어 삭제")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PARENT')")
    fun deleteMedia(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<Unit>> {
        mediaService.deleteMedia(id, principal.id)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }

    @Operation(summary = "미디어 다운로드 URL 조회")
    @GetMapping("/{id}/download")
    fun getDownloadUrl(
        @PathVariable id: UUID,
        @Parameter(description = "URL 만료 시간 (분)")
        @RequestParam(defaultValue = "60") expiryMinutes: Int
    ): ResponseEntity<ApiResponse<DownloadUrlResponse>> {
        val url = mediaService.getDownloadUrl(id, expiryMinutes)
        return ResponseEntity.ok(ApiResponse.success(DownloadUrlResponse(url)))
    }

    @Operation(summary = "미디어가 있는 날짜 목록 조회")
    @GetMapping("/dates")
    fun getDistinctDates(): ResponseEntity<ApiResponse<List<String>>> {
        val dates = mediaService.getDistinctDates().map { it.toString() }
        return ResponseEntity.ok(ApiResponse.success(dates))
    }
}

data class DownloadUrlResponse(val url: String)
