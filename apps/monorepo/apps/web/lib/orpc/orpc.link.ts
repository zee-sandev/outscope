import { RPCLink } from "@orpc/client/fetch";
import { DedupeRequestsPlugin } from "@orpc/client/plugins";

import { RPC_URL } from "./orpc.url";

// Function to get auth headers from localStorage (client-side only)
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      return {};
    }

    const { state } = JSON.parse(authStorage);
    const headers: Record<string, string> = {};

    // Send session token as Bearer token
    if (state?.session?.token) {
      headers['Authorization'] = `Bearer ${state.session.token}`;
    }

    // Keep tenant ID for multi-tenant context
    if (state?.session?.activeOrganizationId) {
      headers['x-tenant-id'] = state.session.activeOrganizationId;
    }

    return headers;
  } catch {
    return {};
  }
}

export const link = new RPCLink({
  url: RPC_URL,
  plugins: [
    new DedupeRequestsPlugin({
      groups: [
        {
          condition: () => true,
          context: {},
        },
      ],
    }),
  ],
  headers: async () => {
    return getAuthHeaders();
  },
});
