#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface CallOverlayAgoraBridge : NSObject

+ (instancetype)shared;

- (void)applyMicMuted:(BOOL)isMuted;
- (void)leaveCallMedia;

@end

NS_ASSUME_NONNULL_END
