// Quick test to check if API methods are properly exported
import { api } from './src/lib/api.ts';

console.log('API object:', api);
console.log('signIn method:', api.signIn);
console.log('Methods available:', Object.keys(api));