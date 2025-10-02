# Authentication System Guide

## Overview

The application uses Supabase Auth with an enhanced magic link authentication system following industry standards. The authentication flow provides a seamless user experience with automatic session management, redirect handling, and persistent authentication state.

## Key Features

### 1. **Magic Link Authentication**

- **Passwordless login**: Users can sign in using magic links sent to their email
- **Password option**: Traditional password authentication is also available
- **Smart redirect**: After authentication, users are redirected to their intended destination
- **Session persistence**: Sessions are automatically refreshed to maintain user login state

### 2. **Authentication Flow**

#### Magic Link Process:

1. User enters email on login page
2. Magic link is sent to their email with redirect parameter
3. User clicks the link in email
4. System verifies the token and creates a session
5. User is automatically redirected to the app (dashboard or intended page)

#### Key Improvements:

- **Direct app access**: Magic links take users directly into the app without additional steps
- **Redirect memory**: System remembers where users were trying to go before login
- **Error handling**: Clear error messages and recovery options
- **Loading states**: Visual feedback during authentication process

### 3. **Session Management**

- **Auto-refresh**: Sessions are automatically refreshed before expiration
- **State synchronization**: Authentication state is synchronized across tabs
- **Secure storage**: Sessions use secure, httpOnly cookies
- **Monitoring**: Session expiration is monitored with automatic refresh

## File Structure

```
src/
├── app/auth/
│   ├── login/page.tsx          # Enhanced login page with magic link
│   ├── callback/page.tsx       # Handles magic link verification
│   └── signup/page.tsx         # User registration
├── lib/auth/
│   └── utils.ts               # Authentication utilities
├── providers/
│   └── auth-provider.tsx      # React context for auth state
└── middleware.ts              # Route protection and session handling
```

## Usage Examples

### 1. Client-Side Authentication

```typescript
import { useAuth } from '@/providers/auth-provider'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      Welcome, {user.email}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### 2. Protected Routes

```typescript
import { useRequireAuth } from '@/providers/auth-provider'

function ProtectedPage() {
  const { user, loading } = useRequireAuth()

  if (loading) return <div>Loading...</div>

  return <div>Protected content for {user?.email}</div>
}
```

### 3. Server-Side Authentication

```typescript
import { serverAuth } from '@/lib/auth/utils'

export default async function ServerPage() {
  const user = await serverAuth.requireAuth('/protected-page')

  return <div>Server-rendered content for {user.email}</div>
}
```

### 4. API Route Protection

```typescript
import { apiAuth } from '@/lib/auth/utils'

export async function GET(request: Request) {
  const user = await apiAuth.verifyRequest(request)

  if (!user) {
    return apiAuth.unauthorizedResponse()
  }

  // Handle authenticated request
  return Response.json({ user: user.email })
}
```

## Authentication Utilities

### Client-Side Utilities (`clientAuth`)

- `getUser()`: Get current user
- `signOut()`: Sign out user
- `isAuthenticated()`: Check authentication status
- `refreshSession()`: Manually refresh session
- `setupAutoRefresh()`: Enable automatic session refresh

### Server-Side Utilities (`serverAuth`)

- `getUser()`: Get user on server
- `requireAuth()`: Require authentication or redirect
- `getUserOrganization()`: Get user's organization and role
- `hasRole()`: Check if user has specific role
- `getUserProfile()`: Get user profile data

### Magic Link Utilities (`magicLinkConfig`)

- `getRedirectUrl()`: Generate callback URL with redirect
- `sendMagicLink()`: Send magic link to email

### Session Manager (`sessionManager`)

- `storeRedirectUrl()`: Store intended destination
- `getRedirectUrl()`: Retrieve and clear stored URL
- `isSessionExpired()`: Check session expiration
- `setupSessionMonitoring()`: Monitor session status

## Configuration

### Environment Variables

```env
# Required for authentication
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional - for magic link redirects
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Middleware Configuration

The middleware automatically:

- Protects routes requiring authentication
- Redirects unauthenticated users to login
- Preserves intended destination for redirect after login
- Handles API route authentication

Protected routes are configured in `src/middleware.ts`:

- All routes except `/auth/*` paths require authentication
- API routes return 401 JSON response when unauthenticated
- Public routes can be configured in the `publicRoutes` array

## Security Features

1. **CSRF Protection**: Built into Supabase Auth
2. **Secure Sessions**: HTTPOnly cookies with SameSite protection
3. **Token Refresh**: Automatic token refresh before expiration
4. **Open Redirect Prevention**: Validates redirect URLs
5. **Rate Limiting**: Built-in rate limiting for auth endpoints

## Testing the Authentication

### Manual Testing Checklist

1. **Magic Link Flow**
   - [ ] Send magic link from login page
   - [ ] Click link in email
   - [ ] Verify automatic redirect to app
   - [ ] Check redirect to intended page works

2. **Password Authentication**
   - [ ] Sign in with password
   - [ ] Verify redirect after login
   - [ ] Check "forgot password" flow

3. **Session Management**
   - [ ] Sessions persist across page refreshes
   - [ ] Sessions sync across tabs
   - [ ] Auto-refresh works before expiration
   - [ ] Sign out clears session properly

4. **Protected Routes**
   - [ ] Unauthenticated users redirected to login
   - [ ] Redirect URL preserved after login
   - [ ] API routes return 401 when unauthenticated

## Troubleshooting

### Common Issues

1. **Magic link not working**
   - Check email configuration in Supabase dashboard
   - Verify `NEXT_PUBLIC_APP_URL` is set correctly
   - Check spam folder for magic link email

2. **Session not persisting**
   - Ensure cookies are enabled
   - Check for CORS issues if using custom domain
   - Verify Supabase URL and keys are correct

3. **Redirect not working after login**
   - Check middleware configuration
   - Verify redirect URL validation logic
   - Ensure AuthProvider is wrapping the app

## Best Practices

1. **Always use HTTPS** in production for secure authentication
2. **Configure email templates** in Supabase for branded emails
3. **Monitor authentication events** for security
4. **Implement rate limiting** for additional security
5. **Use environment-specific URLs** for dev/staging/production
6. **Test authentication flows** regularly
7. **Keep Supabase SDK updated** for latest security patches

## Migration Notes

If migrating from an existing authentication system:

1. **Update login page** to use new `LoginForm` component
2. **Wrap app with AuthProvider** for context access
3. **Update protected routes** to use middleware
4. **Replace auth checks** with new utility functions
5. **Test all authentication flows** thoroughly

---

This authentication system provides a robust, secure, and user-friendly authentication experience following industry best practices.
