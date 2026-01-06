package com.ohmybaby.common.exception

open class BusinessException(
    val code: String,
    override val message: String
) : RuntimeException(message)

class UnauthorizedException(
    message: String = "Unauthorized"
) : BusinessException("UNAUTHORIZED", message)

class ForbiddenException(
    message: String = "Forbidden"
) : BusinessException("FORBIDDEN", message)

class NotFoundException(
    resource: String,
    id: Any
) : BusinessException("NOT_FOUND", "$resource not found with id: $id")

class DuplicateException(
    resource: String,
    field: String,
    value: Any
) : BusinessException("DUPLICATE", "$resource already exists with $field: $value")

class InvalidRequestException(
    message: String
) : BusinessException("INVALID_REQUEST", message)

class FileUploadException(
    message: String
) : BusinessException("FILE_UPLOAD_ERROR", message)
