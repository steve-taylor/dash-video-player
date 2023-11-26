import type {RequestEvent} from './$types'

export async function GET({params}: RequestEvent): Promise<Response> {
    const url = `https://dash.akamaized.net/akamai/bbb_30fps/${params.representationId}/${params.file}`

    const response = await fetch(url)

    const {'content-type': contentType = ''} = Object.fromEntries(
        response.headers.entries()
    )

    return new Response(await response.arrayBuffer(), {
        headers: {
            'Content-Type': contentType
        },
        status: response.status
    })
}
