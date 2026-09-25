#import "CallOverlayAgoraBridge.h"
#import <AgoraRtcWrapper/iris_engine_base.h>
#import <AgoraRtcWrapper/iris_module.h>
#import <objc/message.h>
#import <objc/runtime.h>

static NSString *const kCallOverlayToggleMicNotification = @"CallOverlayNativeToggleMic";
static NSString *const kCallOverlayEndCallNotification = @"CallOverlayNativeEndCall";

@implementation CallOverlayAgoraBridge

+ (instancetype)shared {
  static CallOverlayAgoraBridge *instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[CallOverlayAgoraBridge alloc] init];
  });
  return instance;
}

+ (void)load {
  [CallOverlayAgoraBridge shared];
}

- (instancetype)init {
  self = [super init];
  if (self) {
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(handleToggleMicNotification:)
                   name:kCallOverlayToggleMicNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleEndCallNotification:)
                   name:kCallOverlayEndCallNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)applyMicMuted:(BOOL)isMuted {
  BOOL enableAudio = !isMuted;
  [self callIrisApi:@"RtcEngine_enableLocalAudio_5039d15"
               params:[NSString stringWithFormat:@"{\"enabled\":%@}", enableAudio ? @"true" : @"false"]];
  [self callIrisApi:@"RtcEngine_muteLocalAudioStream_5039d15"
               params:[NSString stringWithFormat:@"{\"mute\":%@}", isMuted ? @"true" : @"false"]];
  [self callIrisApi:@"RtcEngine_updateChannelMediaOptions_7bfc1d7"
               params:[NSString stringWithFormat:@"{\"options\":{\"publishMicrophoneTrack\":%@}}",
                                                 enableAudio ? @"true" : @"false"]];
}

- (void)leaveCallMedia {
  [self callIrisApi:@"RtcEngine_leaveChannel_2c0e3aa" params:@"{\"options\":{}}"];
  [self callIrisApi:@"RtcEngine_enableLocalAudio_5039d15" params:@"{\"enabled\":false}"];
  [self callIrisApi:@"RtcEngine_muteLocalAudioStream_5039d15" params:@"{\"mute\":true}"];
}

- (void)handleToggleMicNotification:(NSNotification *)notification {
  NSNumber *muted = notification.userInfo[@"muted"];
  if (![muted isKindOfClass:[NSNumber class]]) {
    return;
  }
  [self applyMicMuted:muted.boolValue];
}

- (void)handleEndCallNotification:(NSNotification *)notification {
  [self leaveCallMedia];
}

- (IApiEngineBase *)activeIrisEngine {
  Class agoraClass = NSClassFromString(@"AgoraRtcNg");
  if (!agoraClass) {
    return nullptr;
  }

  SEL shareSelector = NSSelectorFromString(@"shareInstance");
  if (![agoraClass respondsToSelector:shareSelector]) {
    return nullptr;
  }

  id agora = ((id (*)(id, SEL))objc_msgSend)(agoraClass, shareSelector);
  if (!agora) {
    return nullptr;
  }

  Ivar ivar = class_getInstanceVariable(agoraClass, "_irisApiEngine");
  if (!ivar) {
    return nullptr;
  }

  uint8_t *objectBytes = (uint8_t *)(__bridge void *)agora;
  IApiEngineBase *engine = *(IApiEngineBase **)(objectBytes + ivar_getOffset(ivar));
  if (engine) {
    return engine;
  }

  SEL newEngineSelector = NSSelectorFromString(@"newIrisApiEngine");
  if ([agora respondsToSelector:newEngineSelector]) {
    ((void (*)(id, SEL))objc_msgSend)(agora, newEngineSelector);
    engine = *(IApiEngineBase **)(objectBytes + ivar_getOffset(ivar));
  }

  return engine;
}

- (int)callIrisApi:(NSString *)funcName params:(NSString *)params {
  IApiEngineBase *engine = [self activeIrisEngine];
  if (!engine) {
    return -1;
  }

  char result[kBasicResultLength] = "";
  NSUInteger paramsLength = [params lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
  ApiParam param = {
      .event = funcName.UTF8String,
      .data = params.UTF8String,
      .data_size = (unsigned int)paramsLength,
      .result = result,
      .buffer = NULL,
      .length = NULL,
      .buffer_count = 0,
  };

  return engine->CallIrisApi(&param);
}

@end

#ifdef __cplusplus
extern "C" {
#endif

void CallOverlayPostToggleMic(BOOL isMuted) {
  [[NSNotificationCenter defaultCenter]
      postNotificationName:kCallOverlayToggleMicNotification
                      object:nil
                    userInfo:@{@"muted" : @(isMuted)}];
}

void CallOverlayPostEndCallMedia(void) {
  [[NSNotificationCenter defaultCenter] postNotificationName:kCallOverlayEndCallNotification
                                                        object:nil
                                                      userInfo:nil];
}

#ifdef __cplusplus
}
#endif
