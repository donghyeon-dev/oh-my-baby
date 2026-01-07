package com.ohmybaby.domain.auth

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.dto.LoginRequest
import com.ohmybaby.domain.auth.dto.RegisterRequest
import com.ohmybaby.domain.auth.dto.TokenResponse
import com.ohmybaby.domain.auth.dto.UserResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    private val userService: com.ohmybaby.domain.user.UserService,
    @Value("\${jwt.refresh-expiration}")
    private val refreshExpiration: Long
) {

    @Operation(summary = "회원가입")
    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest,
        response: HttpServletResponse
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val tokenResponse = authService.register(request)
        setRefreshTokenCookie(response, tokenResponse)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(tokenResponse))
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        response: HttpServletResponse
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val tokenResponse = authService.login(request)
        setRefreshTokenCookie(response, tokenResponse)
        return ResponseEntity.ok(ApiResponse.success(tokenResponse))
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    fun refresh(
        request: HttpServletRequest,
        response: HttpServletResponse
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val refreshToken = getRefreshTokenFromCookie(request)
            ?: return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", "리프레시 토큰이 없습니다"))

        val tokenResponse = authService.refresh(refreshToken)
        setRefreshTokenCookie(response, tokenResponse)
        return ResponseEntity.ok(ApiResponse.success(tokenResponse))
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    fun logout(
        request: HttpServletRequest,
        response: HttpServletResponse,
        @AuthenticationPrincipal principal: UserPrincipal?
    ): ResponseEntity<ApiResponse<Unit>> {
        // Try to logout using refresh token from cookie
        val refreshToken = getRefreshTokenFromCookie(request)
        if (refreshToken != null) {
            authService.logoutWithToken(refreshToken)
        } else if (principal != null) {
            // Fallback: logout all sessions for authenticated user
            authService.logout(principal.id)
        }

        // Clear cookie
        clearRefreshTokenCookie(response)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    fun me(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.getUserById(principal.id)
        return ResponseEntity.ok(ApiResponse.success(user))
    }

    private fun setRefreshTokenCookie(response: HttpServletResponse, tokenResponse: TokenResponse) {
        val cookie = Cookie("refreshToken", tokenResponse.refreshToken).apply {
            isHttpOnly = true
            secure = true
            path = "/api/auth"
            maxAge = (refreshExpiration / 1000).toInt()
            setAttribute("SameSite", "Strict")
        }
        response.addCookie(cookie)
    }

    private fun getRefreshTokenFromCookie(request: HttpServletRequest): String? {
        return request.cookies?.find { it.name == "refreshToken" }?.value
    }

    private fun clearRefreshTokenCookie(response: HttpServletResponse) {
        val cookie = Cookie("refreshToken", "").apply {
            isHttpOnly = true
            secure = true
            path = "/api/auth"
            maxAge = 0
            setAttribute("SameSite", "Strict")
        }
        response.addCookie(cookie)
    }
}
