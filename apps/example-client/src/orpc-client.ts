import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import type { contract } from '../../example-expected/src/contracts'

const rpcLink = new RPCLink({
  url: new URL('/rpc', 'http://localhost:3000'),
})

export const orpcClient: ContractRouterClient<typeof contract> = createORPCClient(rpcLink)
