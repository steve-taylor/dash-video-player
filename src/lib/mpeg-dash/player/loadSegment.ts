import type {
    DashManifest,
    BaseDashAdaptationSet,
    BaseRepresentation
} from '../manifest/types'
import getSegmentUrl from './getSegmentUrl'
import loadArrayBuffer from './loadArrayBuffer'

/**
 * Load the numbered segment into the source buffer.
 *
 * @param manifest - parsed DASH manifest
 * @param videoBaseUrl - base URL of segments
 * @param sourceBuffer - source buffer to push segments into
 * @param adaptationSet - adaptation set
 * @param representation - representation
 * @param index - index of the segment to download
 * @param abortSignal - optional <code>AbortSignal</code> to cancel the request
 */
export default async function loadSegment(
    manifest: DashManifest,
    videoBaseUrl: string,
    sourceBuffer: SourceBuffer,
    adaptationSet: BaseDashAdaptationSet,
    representation: BaseRepresentation,
    index: number,
    abortSignal?: AbortSignal
): Promise<void> {
    const segment = await loadArrayBuffer(
        getSegmentUrl(
            manifest,
            videoBaseUrl,
            adaptationSet,
            representation,
            index
        ),
        abortSignal
    )

    sourceBuffer.appendBuffer(segment)
}
