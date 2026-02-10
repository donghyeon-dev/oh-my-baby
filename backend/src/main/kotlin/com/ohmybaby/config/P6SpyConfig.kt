package com.ohmybaby.config

import com.p6spy.engine.logging.Category
import com.p6spy.engine.spy.P6SpyOptions
import com.p6spy.engine.spy.appender.MessageFormattingStrategy
import jakarta.annotation.PostConstruct
import org.hibernate.engine.jdbc.internal.FormatStyle
import org.springframework.context.annotation.Configuration

@Configuration
class P6SpyConfig {

    @PostConstruct
    fun init() {
        P6SpyOptions.getActiveInstance().logMessageFormat = PrettyMessageFormat::class.java.name
    }
}

class PrettyMessageFormat : MessageFormattingStrategy {

    companion object {
        // ANSI colors
        private const val RESET = "\u001B[0m"
        private const val CYAN = "\u001B[36m"
        private const val YELLOW = "\u001B[33m"
        private const val GREEN = "\u001B[32m"
        private const val GRAY = "\u001B[90m"
    }

    override fun formatMessage(
        connectionId: Int,
        now: String?,
        elapsed: Long,
        category: String?,
        prepared: String?,
        sql: String?,
        url: String?
    ): String {
        if (sql.isNullOrBlank()) return ""

        val formattedSql = formatSql(category, sql)

        return buildString {
            append("\n")
            append("${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n")
            append("${YELLOW}Execution Time${RESET}: ${GREEN}${elapsed}ms${RESET}\n")
            append("${formattedSql}\n")
            append("${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}")
        }
    }

    private fun formatSql(category: String?, sql: String): String {
        val trimmed = sql.trim().replace("\\s+".toRegex(), " ")

        if (trimmed.isBlank()) return ""

        val formatter = when {
            Category.STATEMENT.name == category -> {
                if (isDDL(trimmed)) FormatStyle.DDL.formatter
                else FormatStyle.BASIC.formatter
            }
            else -> FormatStyle.BASIC.formatter
        }

        return highlightSql(formatter.format(trimmed))
    }

    private fun isDDL(sql: String): Boolean {
        val upper = sql.uppercase()
        return upper.startsWith("CREATE") || upper.startsWith("ALTER") || upper.startsWith("DROP")
    }

    private fun highlightSql(sql: String): String {
        val keywords = listOf(
            "SELECT", "FROM", "WHERE", "AND", "OR", "INSERT", "INTO", "VALUES",
            "UPDATE", "SET", "DELETE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
            "ON", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET",
            "FETCH", "FIRST", "ROWS", "ONLY", "ASC", "DESC", "AS",
            "DISTINCT", "COUNT", "SUM", "AVG", "MAX", "MIN",
            "IS", "NOT", "NULL", "IN", "EXISTS", "BETWEEN", "LIKE",
            "COALESCE", "CAST", "CASE", "WHEN", "THEN", "ELSE", "END"
        )

        var result = sql
        for (keyword in keywords.sortedByDescending { it.length }) {
            result = result.replace(
                "(?i)\\b($keyword)\\b".toRegex()
            ) { "${CYAN}${it.value.uppercase()}${RESET}" }
        }

        return result
    }
}
