# React Query Integration

This document outlines the React Query (TanStack Query) integration in the Rituals app.

## ✅ What's Implemented

### 🎯 **Core Features**

- **Automatic Caching**: API responses are cached and reused across components
- **Background Refetching**: Data stays fresh with intelligent background updates
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Loading States**: Built-in loading and error state management
- **Retry Logic**: Automatic retry on network failures
- **Offline Support**: Graceful handling when network is unavailable

### 🔧 **Technical Setup**

#### Query Client Configuration (`lib/query-client.ts`)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data 10 minutes
      retry: 2, // Retry failed requests 2x
      refetchOnWindowFocus: true, // Refetch on window focus
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
});
```

#### Centralized Query Keys

```typescript
export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
    stats: ["auth", "stats"] as const,
  },
  rituals: {
    user: (params?: object) => ["rituals", "user", params] as const,
    public: (params?: object) => ["rituals", "public", params] as const,
    byId: (id: string) => ["rituals", "byId", id] as const,
  },
};
```

### 🎨 **React Query Hooks**

#### Authentication Hooks

- `useAuth()` - Combined auth state and mutations
- `useCurrentUser()` - Fetch current user data
- `useLogin()` - Login mutation with automatic caching
- `useRegister()` - Registration mutation
- `useLogout()` - Logout with cache clearing

#### Ritual Hooks

- `useUserRituals(params)` - Fetch user's rituals with filtering
- `usePublicRituals(params)` - Fetch public rituals with search/sort
- `useCreateRitual()` - Create new ritual with optimistic updates
- `useUpdateRitual()` - Update ritual with rollback on error
- `useDeleteRitual()` - Delete with optimistic removal
- `useForkRitual()` - Fork ritual with cache updates
- `usePublishRitual()` / `useUnpublishRitual()` - Publishing mutations

## 🚀 **Key Benefits**

### 1. **Better User Experience**

```typescript
// Before: Manual loading states
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// After: Built-in states
const { data, isLoading, error } = useUserRituals();
```

### 2. **Automatic Cache Management**

```typescript
// Fork a ritual - automatically updates:
// 1. User rituals list (adds new fork)
// 2. Public rituals (increments fork count)
// 3. Individual ritual cache
const forkMutation = useForkRitual();
forkMutation.mutate(ritualId); // Handles all cache updates
```

### 3. **Optimistic Updates**

```typescript
// UI updates immediately, rolls back on error
const updateMutation = useUpdateRitual();
updateMutation.mutate(
  { id, updates },
  {
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["rituals", "byId", id] });

      // Optimistically update
      queryClient.setQueryData(["rituals", "byId", id], (old) => ({
        ...old,
        ...updates,
      }));
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(["rituals", "byId", id], context.previousData);
    },
  }
);
```

### 4. **Smart Refetching**

- **Window Focus**: Refetch stale data when user returns to tab
- **Network Reconnect**: Automatically sync when connection restored
- **Manual Refresh**: Easy refresh with `refetch()` function
- **Background Updates**: Keep data fresh without blocking UI

### 5. **Toast Notifications**

```typescript
const createMutation = useCreateRitual();
// Automatically shows success/error toasts
createMutation.mutate(ritualData);
// ✅ "Morning Routine created successfully!"
```

## 🔧 **Development Tools**

### React Query DevTools

Access at: http://localhost:3000 (bottom-left corner)

- View all queries and their states
- Inspect cached data
- Manually trigger refetches
- Debug query invalidation

### Cache Inspection

```typescript
// Get cached data
const cachedUser = queryClient.getQueryData(["auth", "user"]);

// Invalidate cache
queryClient.invalidateQueries({ queryKey: ["rituals"] });

// Remove from cache
queryClient.removeQueries({ queryKey: ["rituals", "byId", ritualId] });
```

## 📊 **Performance Optimizations**

### 1. **Stale-While-Revalidate**

- Shows cached data immediately
- Fetches fresh data in background
- Updates UI when new data arrives

### 2. **Request Deduplication**

- Multiple components requesting same data = single network request
- Automatic request batching

### 3. **Background Prefetching**

```typescript
// Prefetch ritual details on hover
const onRitualHover = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ["rituals", "byId", id],
    queryFn: () => api.getRitualById(id),
  });
};
```

## 🎯 **Best Practices**

### 1. **Use Proper Query Keys**

```typescript
// ✅ Good - specific and cacheable
useUserRituals({ category: "fitness", limit: 10 });

// ❌ Bad - too generic
useUserRituals();
```

### 2. **Handle Loading States**

```typescript
const { data, isLoading, error } = useUserRituals();

if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage />;
return <RitualsList rituals={data.rituals} />;
```

### 3. **Optimistic Updates for Better UX**

```typescript
// For instant feedback on user actions
const likeMutation = useLikeRitual();
likeMutation.mutate(ritualId); // UI updates immediately
```

## 🔍 **Debugging**

### Common Issues

1. **Stale Data**: Check `staleTime` configuration
2. **Too Many Requests**: Verify query key consistency
3. **Cache Not Updating**: Ensure proper invalidation after mutations
4. **Loading States**: Check `enabled` conditions on queries

### Debug Commands

```typescript
// Log all queries
console.log(queryClient.getQueryCache().getAll());

// Reset all caches
queryClient.clear();

// Force refetch all
queryClient.refetchQueries();
```

## 🚀 **Next Steps**

1. **Add Infinite Queries** for paginated ritual lists
2. **Implement Prefetching** for better perceived performance
3. **Add Offline Mutations** for better offline experience
4. **Optimistic Updates** for more user interactions
5. **Background Sync** for real-time collaboration features

---

The React Query integration provides a robust foundation for data management with excellent user experience and developer productivity! 🎉
