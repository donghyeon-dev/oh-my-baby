package com.ohmybaby.common.response

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.LocalDateTime

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ErrorInfo? = null,
    val timestamp: LocalDateTime = LocalDateTime.now()
) {
    companion object {
        fun <T> success(data: T): ApiResponse<T> {
            return ApiResponse(success = true, data = data)
        }

        fun <T> success(): ApiResponse<T> {
            return ApiResponse(success = true)
        }

        fun <T> error(code: String, message: String): ApiResponse<T> {
            return ApiResponse(
                success = false,
                error = ErrorInfo(code, message)
            )
        }
    }
}

data class ErrorInfo(
    val code: String,
    val message: String
)

data class PagedResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrevious: Boolean
)
