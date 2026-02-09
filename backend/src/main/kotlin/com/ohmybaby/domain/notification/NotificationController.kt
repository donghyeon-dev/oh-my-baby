package com.ohmybaby.domain.notification

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.UserPrincipal
import com.ohmybaby.domain.notification.dto.NotificationListResponse
import com.ohmybaby.domain.notification.dto.UnreadCountResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@Tag(name = "Notification", description = "알림 API")
@RestController
@RequestMapping("/api/notifications")
class NotificationController(
    private val notificationService: NotificationService
) {

    @Operation(summary = "알림 목록 조회")
    @GetMapping
    fun getNotifications(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<ApiResponse<NotificationListResponse>> {
        val notifications = notificationService.getNotifications(principal.id, page, size)
        return ResponseEntity.ok(ApiResponse.success(notifications))
    }

    @Operation(summary = "읽지 않은 알림 개수 조회")
    @GetMapping("/unread-count")
    fun getUnreadCount(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<UnreadCountResponse>> {
        val count = notificationService.getUnreadCount(principal.id)
        return ResponseEntity.ok(ApiResponse.success(UnreadCountResponse(count)))
    }

    @Operation(summary = "알림 읽음 처리")
    @PutMapping("/{id}/read")
    fun markAsRead(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<Unit>> {
        notificationService.markAsRead(id, principal.id)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }

    @Operation(summary = "모든 알림 읽음 처리")
    @PutMapping("/read-all")
    fun markAllAsRead(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<Unit>> {
        notificationService.markAllAsRead(principal.id)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }
}
