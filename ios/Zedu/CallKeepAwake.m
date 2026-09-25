#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallKeepAwake, NSObject)

RCT_EXTERN_METHOD(setEnabled:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
