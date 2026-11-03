jest.mock('react-native-audio-recorder-player', () => {
  return jest.fn().mockImplementation(() => ({
    setPlaybackSpeed: jest.fn().mockResolvedValue('ok'),
    stopPlayer: jest.fn().mockResolvedValue('ok'),
    removePlayBackListener: jest.fn(),
  }));
});

import { voiceNotePlaybackService } from '@/services/voice-note-playback.service';

describe('voice note playback speed', () => {
  afterEach(async () => {
    // Back to 1x so tests do not depend on each other.
    while (voiceNotePlaybackService.getState().playbackSpeed !== 1) {
      await voiceNotePlaybackService.cyclePlaybackSpeed();
    }
  });

  it('starts at 1x', () => {
    expect(voiceNotePlaybackService.getState().playbackSpeed).toBe(1);
  });

  it('cycles 1x, 1.5x, 2x and back to 1x', async () => {
    const seen: number[] = [];
    for (let i = 0; i < 3; i++) {
      await voiceNotePlaybackService.cyclePlaybackSpeed();
      seen.push(voiceNotePlaybackService.getState().playbackSpeed);
    }
    expect(seen).toEqual([1.5, 2, 1]);
  });

  it('keeps the chosen speed when playback stops', async () => {
    await voiceNotePlaybackService.cyclePlaybackSpeed();
    await voiceNotePlaybackService.stop();
    expect(voiceNotePlaybackService.getState().playbackSpeed).toBe(1.5);
  });

  it('tells subscribers when the speed changes', async () => {
    const listener = jest.fn();
    const unsubscribe = voiceNotePlaybackService.subscribe(listener);
    await voiceNotePlaybackService.cyclePlaybackSpeed();
    unsubscribe();
    expect(listener).toHaveBeenCalled();
  });
});
