import type {
    DashManifest,
    BaseDashAdaptationSet,
    BaseRepresentation
} from '../manifest/types'

/**
 * Get a numbered media segment's URL.
 *
 * @param manifest - parsed DASH manifest
 * @param videoBaseUrl - base URL of the video
 * @param adaptationSet - adaptation set (video or audio)
 * @param representation - representation (video or audio)
 * @param index - index of the segment to download
 * @returns the URL of the numbered segment
 */
export default function getSegmentUrl(
    manifest: DashManifest,
    videoBaseUrl: string,
    adaptationSet: BaseDashAdaptationSet,
    representation: BaseRepresentation,
    index: number
) {
    return `${videoBaseUrl}${
        manifest.baseUrl
    }/${adaptationSet.segmentTemplate.media
        .replaceAll('$RepresentationID$', representation.id)
        .replaceAll('$Bandwidth$', `${representation.bandwidth}`)
        .replaceAll('$Number$', `${index}`)}`
}
