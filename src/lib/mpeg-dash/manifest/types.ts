export type SegmentTemplate = {
    duration: number // seconds
    timescale: number
    media: string // e.g. "$RepresentationID$/$RepresentationID$_$Number$.m4v"
    startNumber: number
    initialization: string // "$RepresentationID$/$RepresentationID$_0.m4v"
}

export type BaseRepresentation = {
    id: string
    codecs: string
    bandwidth: number
}

export type VideoRepresentation = BaseRepresentation & {
    width: number
    height: number
    frameRate: number
    sar: string // aspect ratio, e.g. "1:1"
    scanType: 'progressive' | 'interlaced' // interlaced was a guess
}

export type AudioChannelConfiguration = {
    value: number
}

export type AudioRepresentation = BaseRepresentation & {
    audioSamplingRate: number
    audioChannelConfiguration: AudioChannelConfiguration
}

export type BaseDashAdaptationSet = {
    mimeType: string
    subsegmentAlignment: boolean
    subsegmentStartsWithSAP: number
    segmentTemplate: SegmentTemplate
}

export type DashVideoAdaptationSet = BaseDashAdaptationSet & {
    contentType: 'video'
    par: string // aspect ratio
    representations: VideoRepresentation[]
}

export type DashAudioAdaptationSet = BaseDashAdaptationSet & {
    contentType: 'audio'
    representations: AudioRepresentation[]
}

export type DashAdaptationSet = DashVideoAdaptationSet | DashAudioAdaptationSet

export type DashPeriod = {
    adaptationSets: DashAdaptationSet[]
}

export type DashManifest = {
    type: 'static' | 'dynamic'
    mediaPresentationDuration: number
    minBufferTime: number
    profiles: string
    baseUrl: string
    periods: DashPeriod[]
}
