/**
 * Fetch a DASH manifest and return its DOM.
 *
 * @param url - the manifest's URL
 * @param signal - an optional signal to abort the request
 * @returns the DASH manifest's DOM
 */
export default async function getDashManifest(
    url: string,
    signal?: AbortSignal
): Promise<XMLDocument> {
    const xhr = new XMLHttpRequest()

    xhr.open('GET', url)
    xhr.responseType = 'document'
    xhr.overrideMimeType('text/xml')

    if (signal) {
        signal.addEventListener('abort', () => xhr.abort(), {once: true})
    }

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status < 400) {
                resolve(xhr.responseXML!)
            } else if (xhr.readyState !== XMLHttpRequest.DONE) {
                reject(
                    new Error(
                        'A network error occurred while fetching the DASH manifest'
                    )
                )
            } else {
                reject(
                    new Error(
                        'An error occurred while fetching the DASH manifest',
                        {
                            cause: {
                                status: xhr.status,
                                message: xhr.statusText,
                                body: xhr.responseText
                            }
                        }
                    )
                )
            }
        }

        xhr.onabort = () => {
            reject(new DOMException('The request was aborted', 'AbortError'))
        }

        xhr.send()
    })
}
