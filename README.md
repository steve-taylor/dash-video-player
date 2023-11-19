# DASH video player

This is a toy DASH video player that I’m building to gain a better
understanding of adaptive video streaming.

## Project phases

- [x] Set up a SvelteKit project with a single page and a video element
- [x] Load and parse the DASH manifest of a single-period static video
- [ ] Load segments for a single bitrate and feed them into the buffer
- [ ] Throttle segment loading to conserve egress
- [ ] Handle seeking/scrubbing by loading segments at and after the current
      time
- [ ] Implement ABR based on bandwidth and switch between different
      representations
- [ ] Make ABR account for video element size in physical pixels
- [ ] Add Widevine (with and without licence renewal)
- [ ] Add multiple periods with a subset of them protected by Widevine
- [ ] Support multiple DRM keys
- [ ] Play dynamic (live) instead of static (VOD) with all of the above
      features
- [ ] Support compact manifests (for static and dynamic videos)
- [ ] FairPlay (with and without licence renewal)
- [ ] PlayReady (with and without licence renewal)

## Ideas

If this progresses beyond the toy stage:

* Convert this repo into a monorepo and move the DASH player to its own package
* Support marking periods as watched (e.g. already-watched ad breaks) and
  seamlessly skipping watched periods without buffering
* Support loading the first n segments from a specific time to support
  seamlessly jumping to an arbitrary time, e.g. to skip credits
* Create a HLS player supporting all the above project phases
* Unify DASH and HLS into a (mostly) unified model
* Modularise the library to support many types of customisation, such as the
  ability to re-invent parts of the player such as ABR or DRM.
* Support customising the DRM key system and `addSourceBuffer` feature flags
  (to support the highest DRM robustness on a device that will remain nameless
  here)
* Create an ad-breaks layer with synthetic events such as `timeupdate` that
  remove ad breaks and new custom events that allow a player UI to indicate
  that ads are being played.
