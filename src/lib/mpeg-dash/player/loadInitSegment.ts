import type {
    DashManifest,
    BaseDashAdaptationSet,
    BaseRepresentation
} from '../manifest/types'
import getInitSegmentUrl from './getInitSegmentUrl'
import loadArrayBuffer from './loadArrayBuffer'

/**
 * Load the initialisation segment.
 *
 * @param manifest - parsed DASH manifest
 * @param videoBaseUrl - base URL of the segments
 * @param sourceBuffer - source buffer
 * @param adaptationSet - adaptation set
 * @param representation - representation
 * @param abortSignal - an optional <code>AbortSignal</code> to cancel the request
 */
export default async function loadInitSegment(
    manifest: DashManifest,
    videoBaseUrl: string,
    sourceBuffer: SourceBuffer,
    adaptationSet: BaseDashAdaptationSet,
    representation: BaseRepresentation,
    abortSignal?: AbortSignal
): Promise<void> {
    const segment = await loadArrayBuffer(
        getInitSegmentUrl(
            manifest,
            videoBaseUrl,
            adaptationSet,
            representation
        ),
        abortSignal
    )

    sourceBuffer.appendBuffer(segment)
}
