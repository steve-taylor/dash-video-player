import type {
    BaseDashAdaptationSet,
    BaseRepresentation,
    DashManifest
} from '../manifest/types'

/**
 * Get the initial media segment's URL.
 *
 * @param manifest - parsed DASH manifest
 * @param videoBaseUrl - base URL of the video
 * @param adaptationSet - adaptation set (video or audio)
 * @param representation - representation (video or audio)
 * @returns the URL of the init segment
 */
export default function getInitSegmentUrl(
    manifest: DashManifest,
    videoBaseUrl: string,
    adaptationSet: BaseDashAdaptationSet,
    representation: BaseRepresentation
) {
    return `${videoBaseUrl}${
        manifest.baseUrl
    }/${adaptationSet.segmentTemplate.initialization
        .replaceAll('$RepresentationID$', representation.id)
        .replaceAll('$Bandwidth$', `${representation.bandwidth}`)}`
}
