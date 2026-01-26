# Oh My Baby - Development Guidelines

## Testing Requirements

Testing is fundamental to this project. All implementations must include appropriate tests.

### Backend Testing

**Unit Tests (Required)**
- Location: `backend/src/test/kotlin/`
- Framework: JUnit 5 + MockK
- Run: `./gradlew test`

For every new feature:
1. Create unit tests for service layer logic
2. Mock external dependencies (repositories, storage services)
3. Test happy path and error cases
4. Verify proper exception handling

Example test pattern:
```kotlin
@ExtendWith(MockKExtension::class)
class MyServiceTest {
    @MockK
    private lateinit var repository: MyRepository

    @InjectMockKs
    private lateinit var service: MyService

    @Test
    fun `should do expected behavior when given valid input`() {
        // given
        every { repository.findById(any()) } returns mockEntity

        // when
        val result = service.doSomething(id)

        // then
        assertThat(result).isNotNull
        verify { repository.findById(id) }
    }
}
```

### Frontend Testing

**Unit Tests (Required)**
- Location: `frontend/src/**/__tests__/`
- Framework: Jest + React Testing Library
- Run: `npm test`

For every new feature:
1. Create unit tests for service functions (API calls)
2. Create component tests for UI behavior
3. Mock external dependencies (API, stores)
4. Test user interactions and state changes

Example test pattern:
```typescript
jest.mock('../api')

describe('myService', () => {
  it('should return expected data on success', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

    const result = await myService.getData()

    expect(result).toEqual(expectedData)
    expect(mockedApi.get).toHaveBeenCalledWith('/endpoint')
  })
})
```

**E2E Testing (Recommended)**
- Tool: Chrome DevTools MCP or Playwright
- Run manually during development
- Document test scenarios in code comments

E2E test scenarios to cover:
1. Authentication flow (register, login, logout)
2. Protected route access (session persistence)
3. Role-based access control (ADMIN vs VIEWER)
4. Core feature flows (upload, gallery view, etc.)

### Test Coverage Expectations

| Area | Minimum Coverage |
|------|-----------------|
| Service Layer (Backend) | 80% |
| Service Functions (Frontend) | 80% |
| UI Components | 60% |
| E2E Critical Paths | All documented |

### Running Tests

```bash
# Backend
cd backend
./gradlew test

# Frontend
cd frontend
npm test

# Frontend with coverage
npm test -- --coverage
```

### Pre-commit Checklist

Before committing any feature:
- [ ] Unit tests written and passing
- [ ] No test regressions (all existing tests pass)
- [ ] Manual E2E verification for UI changes
- [ ] Code compiles without errors

## Development Profiles

### Backend
- `local`: H2 in-memory database (for development/testing)
- `dev`: Development PostgreSQL
- `prod`: Production PostgreSQL

Start with local profile:
```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### Frontend
```bash
npm run dev
```

## Architecture Notes

### Authentication
- JWT-based authentication with access/refresh tokens
- Zustand persist middleware for session management
- AuthGuard component waits for hydration before checking auth state

### Media Upload
- ADMIN role required for uploads
- MinIO S3-compatible storage
- EXIF metadata extraction for photos
- Progress tracking for file uploads
