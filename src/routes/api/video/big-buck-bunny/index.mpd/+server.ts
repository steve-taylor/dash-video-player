export async function GET(): Promise<Response> {
    const response = await fetch(
        'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd'
    )

    const body = await response.text()

    const {'content-type': contentType = ''} = Object.fromEntries(
        response.headers.entries()
    )

    return new Response(body, {
        headers: {
            'Content-Type': contentType
        }
    })
}
