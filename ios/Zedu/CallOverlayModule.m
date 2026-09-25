#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CallOverlay, RCTEventEmitter)

RCT_EXTERN_METHOD(canDrawOverlays:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestOverlayPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(prepareOverlay:(NSString *)title
                  isMuted:(BOOL)isMuted
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(showOverlay:(NSString *)title
                  isMuted:(BOOL)isMuted
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hideOverlay:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(dismissOverlay:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateMicState:(BOOL)isMuted)

RCT_EXTERN_METHOD(bringAppToForeground:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(syncOngoingCallCallKit:(NSString *)buzzCode
                  title:(NSString *)title
                  isActive:(BOOL)isActive
                  alternateBuzzId:(NSString *)alternateBuzzId)

RCT_EXTERN_METHOD(stopScreenBroadcast)

@end
