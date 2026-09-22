// Deduplicate reads only while pending; completed writes can trigger a fresh read.
export const createSingleFlight = () => {
  const pending = new Map()
  const run = (key, load) => {
    if (pending.has(key)) return pending.get(key)
    const request = Promise.resolve().then(load).finally(() => {
      if (pending.get(key) === request) pending.delete(key)
    })
    pending.set(key, request)
    return request
  }
  run.has = key => pending.has(key)
  return run
}
