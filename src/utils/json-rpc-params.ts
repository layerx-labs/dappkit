export function jsonRpcParams(method: string, params: string[], version?: string) {
  return ({jsonrpc: version || `2.0`, method, params})
}