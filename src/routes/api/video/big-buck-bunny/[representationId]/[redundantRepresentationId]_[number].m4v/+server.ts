import type {RequestEvent} from '../../$types'

export async function GET({params}: RequestEvent): Promise<Response> {
    const response = await fetch(
        `https://dash.akamaized.net/akamai/bbb_30fps/${params.representationId}/${params.representationId}_${params.number}.m4v`
    )

    const {'content-type': contentType = ''} = Object.fromEntries(
        response.headers.entries()
    )

    return new Response(await response.arrayBuffer(), {
        headers: {
            'Content-Type': contentType
        }
    })
}
