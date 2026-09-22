/**
 * API Hooks - Main Export
 * Centralized export point for all custom API hooks
 */

// K2 Tax API Hooks
export * from "./k2-tax-api";

/**
 * Usage Example:
 *
 * import { useCustomLogin, useGetAllUsers } from '@/lib/api/hooks';
 *
 * const MyComponent = () => {
 *   const { login, isPending } = useCustomLogin();
 *   const { data: users } = useGetAllUsers();
 *
 *   return (
 *     <button onClick={() => login({...})}>
 *       Login
 *     </button>
 *   );
 * };
 */
