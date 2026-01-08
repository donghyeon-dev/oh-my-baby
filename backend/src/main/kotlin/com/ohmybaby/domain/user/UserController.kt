package com.ohmybaby.domain.user

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.UserPrincipal
import com.ohmybaby.domain.auth.dto.UserResponse
import com.ohmybaby.domain.user.dto.ChangePasswordRequest
import com.ohmybaby.domain.user.dto.UpdateProfileRequest
import com.ohmybaby.domain.user.dto.UpdateRoleRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@Tag(name = "User", description = "사용자 API")
@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    fun getMyProfile(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.getUserById(principal.id)
        return ResponseEntity.ok(ApiResponse.success(user))
    }

    @Operation(summary = "프로필 수정")
    @PutMapping("/me")
    fun updateMyProfile(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: UpdateProfileRequest
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.updateProfile(principal.id, request.name)
        return ResponseEntity.ok(ApiResponse.success(user))
    }

    @Operation(summary = "비밀번호 변경")
    @PutMapping("/me/password")
    fun changePassword(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<ApiResponse<Unit>> {
        userService.changePassword(principal.id, request.currentPassword, request.newPassword)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }

    @Operation(summary = "모든 사용자 조회 (관리자 전용)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllUsers(): ResponseEntity<ApiResponse<List<UserResponse>>> {
        val users = userService.getAllUsers()
        return ResponseEntity.ok(ApiResponse.success(users))
    }

    @Operation(summary = "사용자 조회 (관리자 전용)")
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    fun getUser(
        @PathVariable userId: UUID
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.getUserById(userId)
        return ResponseEntity.ok(ApiResponse.success(user))
    }

    @Operation(summary = "사용자 권한 변경 (관리자 전용)")
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUserRole(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: UpdateRoleRequest
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.updateUserRole(userId, request.role)
        return ResponseEntity.ok(ApiResponse.success(user))
    }
}
