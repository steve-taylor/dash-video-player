import type {
    DashManifest,
    DashAudioAdaptationSet,
    DashVideoAdaptationSet,
    BaseDashAdaptationSet,
    BaseRepresentation
} from '../manifest/types'
import loadInitSegment from './loadInitSegment'
import loadSegment from './loadSegment'

/**
 * Load and play a video from a parsed DASH manifest.
 *
 * @param video - video element
 * @param manifest - parsed DASH manifest
 * @param videoBaseUrl - base URL of the video and audio segments
 * @param abortSignal - optional <code>AbortSignal</code> to abort loading the video
 */
export default function loadAndPlay(
    video: HTMLVideoElement,
    manifest: DashManifest,
    videoBaseUrl: string,
    abortSignal?: AbortSignal
) {
    const [period] = manifest.periods

    if (!period) {
        return
    }

    // For now, just get the first video and audio adaptation sets.
    const videoAdaptationSet = period.adaptationSets.find(
        (adaptationSet): adaptationSet is DashVideoAdaptationSet =>
            adaptationSet.contentType === 'video'
    )
    const audioAdaptationSet = period.adaptationSets.find(
        (adaptationSet): adaptationSet is DashAudioAdaptationSet =>
            adaptationSet.contentType === 'audio'
    )

    if (!videoAdaptationSet || !audioAdaptationSet) {
        return
    }

    const [videoRepresentation] = videoAdaptationSet.representations
    const [audioRepresentation] = audioAdaptationSet.representations

    if (!videoRepresentation || !audioRepresentation) {
        return
    }

    function hasDownloadedAllSegments(
        manifest: DashManifest,
        sourceBuffer: SourceBuffer
    ) {
        return new Promise(resolve => {
            if (!sourceBuffer.buffered?.length) {
                resolve(false)
            }

            sourceBuffer.addEventListener(
                'updateend',
                () =>
                    resolve(
                        sourceBuffer.buffered?.length &&
                            sourceBuffer.buffered.end(0) >=
                                manifest.mediaPresentationDuration
                    ),
                {once: true}
            )
        })
    }

    // Load a bunch of segments into the specified SourceBuffer.
    // In a real video player, these would be loaded based on numerous factors such
    // as the video element's currentTime.
    async function loadSegments(
        manifest: DashManifest,
        adaptationSet: BaseDashAdaptationSet,
        representation: BaseRepresentation,
        sourceBuffer: SourceBuffer
    ) {
        let segmentIndex = adaptationSet.segmentTemplate.startNumber

        do {
            try {
                await loadSegment(
                    manifest,
                    videoBaseUrl,
                    sourceBuffer,
                    adaptationSet,
                    representation,
                    segmentIndex++,
                    abortSignal
                )
            } catch (error) {
                // No more segments? We're done.
                if (
                    error instanceof Error &&
                    ((error?.cause as {status: number}) || undefined)
                        ?.status === 404
                ) {
                    break
                }

                throw error
            }
        } while (!(await hasDownloadedAllSegments(manifest, sourceBuffer)))
    }

    const mediaSource = new MediaSource()

    video.src = URL.createObjectURL(mediaSource)

    mediaSource.addEventListener(
        'sourceopen',
        async () => {
            const videoSourceBuffer = mediaSource.addSourceBuffer(
                `${videoAdaptationSet.mimeType}; codecs="${videoRepresentation.codecs}"`
            )
            const audioSourceBuffer = mediaSource.addSourceBuffer(
                `${audioAdaptationSet.mimeType}; codecs="${audioRepresentation.codecs}"`
            )

            let hasVideoInitSegmentLoaded = false
            let hasAudioInitSegmentLoaded = false

            function updateDuration() {
                if (
                    Number.isNaN(mediaSource.duration) &&
                    hasVideoInitSegmentLoaded &&
                    hasAudioInitSegmentLoaded
                ) {
                    mediaSource.duration = manifest.mediaPresentationDuration
                    video.currentTime = 0
                }
            }

            videoSourceBuffer.addEventListener('updateend', () => {
                hasVideoInitSegmentLoaded = true
                updateDuration()
            })
            videoSourceBuffer.addEventListener('error', error => {
                console.error('Video source buffer error:', error)
            })

            audioSourceBuffer.addEventListener('updateend', () => {
                hasAudioInitSegmentLoaded = true
                updateDuration()
            })
            audioSourceBuffer.addEventListener('error', error => {
                console.error('Audio source buffer error:', error)
            })

            // Load video and audio segments in parallel
            Promise.all([
                // Video segments
                loadInitSegment(
                    manifest,
                    videoBaseUrl,
                    videoSourceBuffer,
                    videoAdaptationSet,
                    videoRepresentation,
                    abortSignal
                ).then(() =>
                    // TODO: Don't load all the segments at once
                    loadSegments(
                        manifest,
                        videoAdaptationSet,
                        videoRepresentation,
                        videoSourceBuffer
                    )
                ),

                // Audio segments
                loadInitSegment(
                    manifest,
                    videoBaseUrl,
                    audioSourceBuffer,
                    audioAdaptationSet,
                    audioRepresentation,
                    abortSignal
                ).then(() =>
                    // TODO: Don't load all the segments at once
                    loadSegments(
                        manifest,
                        audioAdaptationSet,
                        audioRepresentation,
                        audioSourceBuffer
                    )
                )
            ])
        },
        {once: true}
    )
}
