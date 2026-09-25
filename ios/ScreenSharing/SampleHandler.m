#import "SampleHandler.h"

#import "AgoraReplayKitExtension.h"

#import "BroadcastStopHelper.h"

static CFStringRef const kStopScreenBroadcastNotification =
    CFSTR("net.emerj.zedu.stop_screen_broadcast");

@interface SampleHandler () <AgoraReplayKitExtDelegate>
@property(nonatomic, assign) BOOL isFinishing;
- (void)stopBroadcastGracefully;
@end

static void stopScreenBroadcastDarwinCallback(CFNotificationCenterRef center,
                                              void *observer,
                                              CFStringRef name,
                                              const void *object,
                                              CFDictionaryRef userInfo) {
  SampleHandler *handler = (__bridge SampleHandler *)observer;
  dispatch_async(dispatch_get_main_queue(), ^{
    [handler stopBroadcastGracefully];
  });
}

@implementation SampleHandler

- (instancetype)init {
  self = [super init];
  if (self) {
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetDarwinNotifyCenter(),
        (__bridge const void *)(self),
        stopScreenBroadcastDarwinCallback,
        kStopScreenBroadcastNotification,
        NULL,
        CFNotificationSuspensionBehaviorDeliverImmediately);
  }
  return self;
}

- (void)dealloc {
  CFNotificationCenterRemoveObserver(CFNotificationCenterGetDarwinNotifyCenter(),
                                     (__bridge const void *)(self),
                                     kStopScreenBroadcastNotification,
                                     NULL);
}

- (void)broadcastStartedWithSetupInfo:(NSDictionary<NSString *, NSObject *> *)setupInfo {
  [[AgoraReplayKitExt shareInstance] start:self];
}

- (void)broadcastPaused {
  [[AgoraReplayKitExt shareInstance] pause];
}

- (void)broadcastResumed {
  [[AgoraReplayKitExt shareInstance] resume];
}

- (void)broadcastFinished {
  [[AgoraReplayKitExt shareInstance] stop];
}

- (void)processSampleBuffer:(CMSampleBufferRef)sampleBuffer
                   withType:(RPSampleBufferType)sampleBufferType {
  [[AgoraReplayKitExt shareInstance] pushSampleBuffer:sampleBuffer
                                             withType:sampleBufferType];
}

- (void)broadcastFinished:(AgoraReplayKitExt *)broadcast
                   reason:(AgoraReplayKitExtReason)reason {
  [self stopBroadcastGracefully];
}

- (void)stopBroadcastGracefully {
  if (self.isFinishing) {
    return;
  }
  self.isFinishing = YES;
  [[AgoraReplayKitExt shareInstance] stop];
  ZeduFinishBroadcastGracefully(self);
}

@end
