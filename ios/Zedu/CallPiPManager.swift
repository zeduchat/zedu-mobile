import AVKit
import UIKit

final class CallPiPManager: NSObject {
  static let shared = CallPiPManager()

  private var pipController: AVPictureInPictureController?
  private var pipViewController: AVPictureInPictureVideoCallViewController?
  private var widgetView: CallPiPWidgetView?
  private var sourceView: UIView?
  private var onAction: ((String, [String: Any]) -> Void)?
  private var restoreTriggeredExpand = false
  private var suppressRestoreExpand = false
  private var controlActionInProgress = false
  private var allowPiPStop = false
  private var pendingTeardown = false
  private var cachedIsMuted = true

  var isPictureInPictureActive: Bool {
    pipController?.isPictureInPictureActive == true
  }

  func setActionHandler(_ handler: @escaping (String, [String: Any]) -> Void) {
    onAction = handler
  }

  private func emitAction(_ action: String, extras: [String: Any] = [:]) {
    onAction?(action, extras)
  }

  func isSupported() -> Bool {
    AVPictureInPictureController.isPictureInPictureSupported()
  }

  func prepare(title: String, isMuted: Bool) {
    DispatchQueue.main.async {
      guard self.isSupported() else { return }

      self.cachedIsMuted = isMuted
      self.setupIfNeeded()
      self.widgetView?.update(title: title, isMuted: isMuted)
    }
  }

  func show(title: String, isMuted: Bool) {
    DispatchQueue.main.async {
      guard self.isSupported() else { return }

      self.prepare(title: title, isMuted: isMuted)

      let appState = UIApplication.shared.applicationState
      guard appState != .active else { return }

      guard let controller = self.pipController, !controller.isPictureInPictureActive else {
        return
      }

      controller.startPictureInPicture()
    }
  }

  func hide() {
    DispatchQueue.main.async {
      guard let controller = self.pipController else {
        return
      }

      if controller.isPictureInPictureActive {
        if !self.restoreTriggeredExpand {
          self.suppressRestoreExpand = true
          self.allowPiPStop = true
        }
        controller.stopPictureInPicture()
      }
    }
  }

  func dismissOverlay() {
    DispatchQueue.main.async {
      self.teardown()
    }
  }

  func updateMicState(isMuted: Bool) {
    DispatchQueue.main.async {
      self.cachedIsMuted = isMuted
      self.widgetView?.updateMicState(isMuted: isMuted)
    }
  }

  func teardown() {
    DispatchQueue.main.async {
      guard self.pipController != nil else { return }

      if let controller = self.pipController, controller.isPictureInPictureActive {
        self.pendingTeardown = true
        if !self.restoreTriggeredExpand {
          self.suppressRestoreExpand = true
          self.allowPiPStop = true
        }
        controller.stopPictureInPicture()
        return
      }

      self.performTeardownCleanup()
    }
  }

  private func performTeardownCleanup() {
    pendingTeardown = false
    sourceView?.removeFromSuperview()
    sourceView = nil
    widgetView = nil
    pipViewController = nil
    pipController = nil
    restoreTriggeredExpand = false
  }

  private func setupIfNeeded() {
    guard pipController == nil else { return }
    guard let window = Self.keyWindow else { return }

    let source = UIView(frame: CGRect(x: 0, y: 0, width: 2, height: 2))
    source.isUserInteractionEnabled = false
    source.alpha = 0.01
    window.addSubview(source)
    sourceView = source

    let pipVC = CallPiPVideoCallViewController()
    pipVC.preferredContentSize = CGSize(width: 220, height: 120)

    let widget = pipVC.widgetView
    widget.delegate = self
    widgetView = widget

    let contentSource = AVPictureInPictureController.ContentSource(
      activeVideoCallSourceView: source,
      contentViewController: pipVC
    )

    let controller = AVPictureInPictureController(contentSource: contentSource)
    controller.delegate = self
    controller.canStartPictureInPictureAutomaticallyFromInline = true
    pipController = controller
    pipViewController = pipVC
  }

  private static var keyWindow: UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow)
  }
}

extension CallPiPManager: CallPiPWidgetViewDelegate {
  func endCallFromSystemControls() {
    pipWidgetDidTapEndCall()
  }

  func pipWidgetDidTapExpand() {
    allowPiPStop = true
    restoreTriggeredExpand = true
    emitAction("expand")
    hide()
  }

  func pipWidgetDidTapEndCall() {
    allowPiPStop = true
    controlActionInProgress = true
    suppressRestoreExpand = true
    CallOverlayAgoraBridge.shared().leaveCallMedia()
    IncomingCallCallKitManager.shared.endAllCalls()
    emitAction("endCall", extras: ["handledNatively": true])
    stopPiPAndTeardown()
  }

  func pipWidgetDidTapToggleMic() {
    controlActionInProgress = true
    cachedIsMuted.toggle()
    widgetView?.updateMicState(isMuted: cachedIsMuted)
    CallOverlayAgoraBridge.shared().applyMicMuted(cachedIsMuted)
    emitAction("toggleMic", extras: [
      "handledNatively": true,
      "isMuted": cachedIsMuted,
    ])
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) { [weak self] in
      self?.controlActionInProgress = false
    }
  }

  func pipWidgetDidTapToggleEmoji() {
    controlActionInProgress = true
    emitAction("toggleEmoji")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) { [weak self] in
      self?.controlActionInProgress = false
    }
  }

  private func stopPiPAndTeardown() {
    guard let controller = pipController else {
      performTeardownCleanup()
      controlActionInProgress = false
      return
    }

    if controller.isPictureInPictureActive {
      pendingTeardown = true
      controller.stopPictureInPicture()
      return
    }

    performTeardownCleanup()
    controlActionInProgress = false
  }
}

extension CallPiPManager: AVPictureInPictureControllerDelegate {
  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    willStopPictureInPictureWithCompletionHandler completionHandler: @escaping (Bool) -> Void
  ) {
    if allowPiPStop {
      allowPiPStop = false
      completionHandler(true)
      return
    }

    completionHandler(false)
  }

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
  ) {
    if controlActionInProgress || suppressRestoreExpand {
      suppressRestoreExpand = false
      restoreTriggeredExpand = false
      completionHandler(false)
      return
    }

    if restoreTriggeredExpand {
      // Expand was already emitted when the user tapped the widget control.
      restoreTriggeredExpand = false
      completionHandler(true)
      return
    }

    // User tapped the system PiP window to return to the app.
    emitAction("expand")
    completionHandler(true)
  }

  func pictureInPictureControllerDidStopPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    if pendingTeardown {
      performTeardownCleanup()
    }
    controlActionInProgress = false
    suppressRestoreExpand = false
    restoreTriggeredExpand = false
  }
}

private final class CallPiPInteractionView: UIView {
  weak var contentView: UIView?
  weak var widgetView: CallPiPWidgetView?

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = touches.first, let widget = widgetView else {
      super.touchesEnded(touches, with: event)
      return
    }

    let point = touch.location(in: widget)
    if let action = widget.action(at: point) {
      widget.performAction(action)
      return
    }

    super.touchesEnded(touches, with: event)
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard isUserInteractionEnabled, !isHidden, alpha > 0.01 else { return nil }
    guard let content = contentView else { return super.hitTest(point, with: event) }

    let pointInContent = convert(point, to: content)
    if let hit = content.hitTest(pointInContent, with: event) {
      return hit
    }

    if content.point(inside: pointInContent, with: event) {
      return content
    }

    return nil
  }
}

private final class CallPiPVideoCallViewController: AVPictureInPictureVideoCallViewController {
  let widgetView = CallPiPWidgetView()

  override func loadView() {
    let rootView = CallPiPInteractionView()
    rootView.backgroundColor = .clear
    rootView.isUserInteractionEnabled = true
    rootView.contentView = widgetView
    rootView.widgetView = widgetView
    view = rootView

    widgetView.translatesAutoresizingMaskIntoConstraints = false
    rootView.addSubview(widgetView)
    NSLayoutConstraint.activate([
      widgetView.topAnchor.constraint(equalTo: rootView.topAnchor),
      widgetView.bottomAnchor.constraint(equalTo: rootView.bottomAnchor),
      widgetView.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
      widgetView.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
    ])
  }
}
