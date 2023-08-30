export async function forEachPromise<T, R>(
  items: Array<T>,
  func: (item: T, index: number) => Promise<R>
): Promise<Array<R>> {
  const ar: Array<R> = []
  await items.reduce(
    (promise: Promise<R>, item: T, idx: number) => {
      return promise.then(async () => {
        ar.push(await func(item, idx))
        return promise
      })
    },
    Promise.resolve({} as R)
  )
  return ar
}

export const slip = (delay: number) => new Promise(res => setTimeout(res, delay))

export type valueOf<T> = T[keyof T]
