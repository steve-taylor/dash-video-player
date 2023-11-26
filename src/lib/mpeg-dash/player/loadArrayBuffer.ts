/**
 * Load an <code>ArrayBuffer</code> from the specified URL.
 *
 * @param url - a URL
 * @param abortController - optional <code>AbortSignal</code> to abort the request
 * @returns
 */
export default function loadArrayBuffer(
    url: string,
    abortSignal?: AbortSignal
): Promise<ArrayBuffer> {
    const xhr = new XMLHttpRequest()

    xhr.open('GET', url)
    xhr.responseType = 'arraybuffer'

    abortSignal?.addEventListener('abort', () => xhr.abort(), {
        once: true
    })

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status < 400) {
                resolve(xhr.response as ArrayBuffer)
            } else if (xhr.readyState !== XMLHttpRequest.DONE) {
                reject(new Error('A network error occurred'))
            } else {
                reject(
                    new Error('An error occurred', {
                        cause: {
                            status: xhr.status,
                            message: xhr.statusText
                        }
                    })
                )
            }
        }

        xhr.send()
    })
}
