import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '../AuthGuard'
import { useAuthStore } from '@/stores/authStore'
import { User } from '@/types'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}))

describe('AuthGuard', () => {
  const mockReplace = jest.fn()
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockViewerUser: User = {
    id: 1,
    email: 'viewer@example.com',
    name: 'Viewer User',
    role: 'FAMILY',
    createdAt: '2024-01-17T00:00:00Z',
  }

  const mockAdminUser: User = {
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'PARENT',
    createdAt: '2024-01-17T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('when user is authenticated', () => {
    it('should render children for authenticated viewer user', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should render children for authenticated admin user', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })

  })

  describe('when user is not authenticated', () => {
    it('should redirect to login page', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(mockReplace).toHaveBeenCalledWith('/login')
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should not render children', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show loading state while hydrating', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: false,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show loading state while checking after hydration', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('admin route protection', () => {
    it('should render children for admin user when requireParent is true', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard requireParent={true}>
          <div>Admin Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should redirect viewer to gallery when requireParent is true', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard requireParent={true}>
          <div>Admin Content</div>
        </AuthGuard>
      )

      expect(mockReplace).toHaveBeenCalledWith('/gallery')
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('should not redirect viewer when requireParent is false', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard requireParent={false}>
          <div>Regular Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Regular Content')).toBeInTheDocument()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should not redirect viewer when requireParent is not specified', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>Regular Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Regular Content')).toBeInTheDocument()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle authenticated user with null user object', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: null,
        _hasHydrated: true,
      })

      render(
        <AuthGuard requireParent={true}>
          <div>Admin Content</div>
        </AuthGuard>
      )

      expect(mockReplace).toHaveBeenCalledWith('/gallery')
    })

    it('should handle user role change from FAMILY to PARENT', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      const { rerender } = render(
        <AuthGuard requireParent={true}>
          <div>Admin Content</div>
        </AuthGuard>
      )

      expect(mockReplace).toHaveBeenCalledWith('/gallery')

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        _hasHydrated: true,
      })

      rerender(
        <AuthGuard requireParent={true}>
          <div>Admin Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument()
      })
    })

    it('should handle authentication state change from false to true', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
      })

      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(mockReplace).toHaveBeenCalledWith('/login')

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should render multiple children', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockViewerUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('First Child')).toBeInTheDocument()
        expect(screen.getByText('Second Child')).toBeInTheDocument()
        expect(screen.getByText('Third Child')).toBeInTheDocument()
      })
    })

    it('should handle complex nested children', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        _hasHydrated: true,
      })

      render(
        <AuthGuard requireParent={true}>
          <div>
            <header>Header</header>
            <main>
              <section>Section Content</section>
            </main>
            <footer>Footer</footer>
          </div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Header')).toBeInTheDocument()
        expect(screen.getByText('Section Content')).toBeInTheDocument()
        expect(screen.getByText('Footer')).toBeInTheDocument()
      })
    })

    it('should not check auth until hydrated', () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: false,
      })

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      // Should show loading and NOT redirect
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

})
