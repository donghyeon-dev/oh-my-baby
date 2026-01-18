package com.ohmybaby.domain.user

import com.ohmybaby.common.exception.InvalidRequestException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.auth.dto.UserResponse
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {

    fun getUserById(userId: UUID): UserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }
        return UserResponse.from(user)
    }

    fun getUserByEmail(email: String): UserResponse {
        val user = userRepository.findByEmail(email)
            .orElseThrow { NotFoundException("User", email) }
        return UserResponse.from(user)
    }

    @Transactional
    fun updateProfile(userId: UUID, name: String): UserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }

        user.updateName(name)
        val savedUser = userRepository.save(user)
        return UserResponse.from(savedUser)
    }

    @Transactional
    fun changePassword(userId: UUID, currentPassword: String, newPassword: String) {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }

        if (!passwordEncoder.matches(currentPassword, user.password)) {
            throw InvalidRequestException("현재 비밀번호가 올바르지 않습니다")
        }

        user.updatePassword(passwordEncoder.encode(newPassword))
        userRepository.save(user)
    }

    @Transactional
    fun updateUserRole(userId: UUID, role: UserRole): UserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }

        user.updateRole(role)
        val savedUser = userRepository.save(user)
        return UserResponse.from(savedUser)
    }

    fun getAllUsers(): List<UserResponse> {
        return userRepository.findAll().map { UserResponse.from(it) }
    }
}
