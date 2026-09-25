import UIKit

private final class PiPControlButton: UIButton {
  override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    bounds.insetBy(dx: -10, dy: -10).contains(point)
  }
}

enum CallPiPWidgetAction {
  case expand
  case endCall
  case toggleMic
  case toggleEmoji
}

protocol CallPiPWidgetViewDelegate: AnyObject {
  func pipWidgetDidTapExpand()
  func pipWidgetDidTapEndCall()
  func pipWidgetDidTapToggleMic()
  func pipWidgetDidTapToggleEmoji()
}

final class CallPiPWidgetView: UIView {
  weak var delegate: CallPiPWidgetViewDelegate?

  private let headerButton = PiPControlButton(type: .custom)
  private let activeDot = UIView()
  private let titleLabel = UILabel()
  private let expandLabel = UILabel()
  private let emojiButton = PiPControlButton(type: .custom)
  private let micButton = PiPControlButton(type: .custom)
  private let endCallButton = PiPControlButton(type: .custom)

  private var isMuted = true
  private var micTapLocked = false
  private var endCallTapLocked = false

  override init(frame: CGRect) {
    super.init(frame: frame)
    configureView()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    configureView()
  }

  func update(title: String, isMuted: Bool) {
    titleLabel.text = title.isEmpty ? "Buzz call" : title
    updateMicState(isMuted: isMuted)
  }

  func action(at point: CGPoint) -> CallPiPWidgetAction? {
    let targets: [(UIView, CallPiPWidgetAction)] = [
      (endCallButton, .endCall),
      (micButton, .toggleMic),
      (emojiButton, .toggleEmoji),
      (headerButton, .expand),
    ]

    for (view, action) in targets {
      let converted = convert(point, to: view)
      if view.point(inside: converted, with: nil) {
        return action
      }
    }

    return nil
  }

  func performAction(_ action: CallPiPWidgetAction) {
    switch action {
    case .expand:
      handleExpandTap()
    case .endCall:
      handleEndCallTap()
    case .toggleMic:
      handleMicTap()
    case .toggleEmoji:
      handleEmojiTap()
    }
  }

  func updateMicState(isMuted: Bool) {
    self.isMuted = isMuted
    let micImageName = isMuted ? "mic.slash.fill" : "mic.fill"
    let micConfig = UIImage.SymbolConfiguration(pointSize: 16, weight: .semibold)
    micButton.setImage(UIImage(systemName: micImageName, withConfiguration: micConfig), for: .normal)
    micButton.tintColor = isMuted ? .black : .white
    micButton.backgroundColor = isMuted
      ? UIColor.white
      : UIColor.white.withAlphaComponent(0.15)
  }

  private func configureView() {
    isUserInteractionEnabled = true
    backgroundColor = UIColor(red: 30 / 255, green: 30 / 255, blue: 30 / 255, alpha: 0.9)
    layer.cornerRadius = 20
    layer.borderWidth = 1
    layer.borderColor = UIColor.white.withAlphaComponent(0.15).cgColor
    layer.masksToBounds = true

    activeDot.backgroundColor = UIColor(red: 52 / 255, green: 199 / 255, blue: 89 / 255, alpha: 1)
    activeDot.layer.cornerRadius = 4
    activeDot.translatesAutoresizingMaskIntoConstraints = false
    activeDot.widthAnchor.constraint(equalToConstant: 8).isActive = true
    activeDot.heightAnchor.constraint(equalToConstant: 8).isActive = true

    titleLabel.font = .systemFont(ofSize: 12, weight: .bold)
    titleLabel.textColor = .white
    titleLabel.lineBreakMode = .byTruncatingTail
    titleLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

    expandLabel.text = "↗"
    expandLabel.font = .systemFont(ofSize: 14, weight: .semibold)
    expandLabel.textColor = UIColor.white.withAlphaComponent(0.7)

    let headerStack = UIStackView(arrangedSubviews: [activeDot, titleLabel, expandLabel])
    headerStack.axis = .horizontal
    headerStack.alignment = .center
    headerStack.spacing = 6
    headerStack.translatesAutoresizingMaskIntoConstraints = false
    headerStack.isUserInteractionEnabled = false

    headerButton.translatesAutoresizingMaskIntoConstraints = false
    headerButton.isUserInteractionEnabled = true
    headerButton.addSubview(headerStack)
    headerButton.addTarget(self, action: #selector(handleExpandTap), for: .touchUpInside)

    emojiButton.setTitle("😊", for: .normal)
    emojiButton.isUserInteractionEnabled = true
    emojiButton.titleLabel?.font = .systemFont(ofSize: 18)
    emojiButton.backgroundColor = UIColor.white.withAlphaComponent(0.15)
    emojiButton.layer.cornerRadius = 20
    emojiButton.addTarget(self, action: #selector(handleEmojiTap), for: .touchUpInside)

    micButton.backgroundColor = UIColor.white.withAlphaComponent(0.15)
    micButton.layer.cornerRadius = 20
    micButton.isUserInteractionEnabled = true
    micButton.isExclusiveTouch = true
    micButton.addTarget(self, action: #selector(handleMicTap), for: .touchUpInside)
    micButton.addTarget(self, action: #selector(handleMicTap), for: .touchDown)

    let closeConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .bold)
    endCallButton.setImage(
      UIImage(systemName: "xmark", withConfiguration: closeConfig),
      for: .normal
    )
    endCallButton.tintColor = .white
    endCallButton.backgroundColor = UIColor(red: 1, green: 59 / 255, blue: 48 / 255, alpha: 1)
    endCallButton.layer.cornerRadius = 22
    endCallButton.isUserInteractionEnabled = true
    endCallButton.isExclusiveTouch = true
    endCallButton.addTarget(self, action: #selector(handleEndCallTap), for: .touchUpInside)
    endCallButton.addTarget(self, action: #selector(handleEndCallTap), for: .touchDown)

    [emojiButton, micButton, endCallButton].forEach { button in
      button.translatesAutoresizingMaskIntoConstraints = false
    }

    let controlsStack = UIStackView(arrangedSubviews: [emojiButton, micButton, endCallButton])
    controlsStack.axis = .horizontal
    controlsStack.alignment = .center
    controlsStack.distribution = .equalSpacing
    controlsStack.spacing = 8
    controlsStack.translatesAutoresizingMaskIntoConstraints = false

    addSubview(headerButton)
    addSubview(controlsStack)

    NSLayoutConstraint.activate([
      headerStack.topAnchor.constraint(equalTo: headerButton.topAnchor),
      headerStack.bottomAnchor.constraint(equalTo: headerButton.bottomAnchor),
      headerStack.leadingAnchor.constraint(equalTo: headerButton.leadingAnchor),
      headerStack.trailingAnchor.constraint(equalTo: headerButton.trailingAnchor),

      headerButton.topAnchor.constraint(equalTo: topAnchor, constant: 8),
      headerButton.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
      headerButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),

      controlsStack.topAnchor.constraint(equalTo: headerButton.bottomAnchor, constant: 8),
      controlsStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
      controlsStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
      controlsStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),

      emojiButton.widthAnchor.constraint(equalToConstant: 40),
      emojiButton.heightAnchor.constraint(equalToConstant: 40),
      micButton.widthAnchor.constraint(equalToConstant: 40),
      micButton.heightAnchor.constraint(equalToConstant: 40),
      endCallButton.widthAnchor.constraint(equalToConstant: 44),
      endCallButton.heightAnchor.constraint(equalToConstant: 44),
    ])

    update(title: "Buzz call", isMuted: true)
  }

  override func hitTest(_ hitPoint: CGPoint, with event: UIEvent?) -> UIView? {
    guard isUserInteractionEnabled, !isHidden, alpha > 0.01 else { return nil }
    guard point(inside: hitPoint, with: event) else { return nil }

    for subview in [endCallButton, micButton, emojiButton, headerButton] {
      let converted = subview.convert(hitPoint, from: self)
      if let hit = subview.hitTest(converted, with: event) {
        return hit
      }
    }

    return self
  }

  @objc private func handleExpandTap() {
    delegate?.pipWidgetDidTapExpand()
  }

  @objc private func handleEmojiTap() {
    delegate?.pipWidgetDidTapToggleEmoji()
  }

  @objc private func handleMicTap() {
    guard !micTapLocked else { return }
    micTapLocked = true
    delegate?.pipWidgetDidTapToggleMic()
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
      self.micTapLocked = false
    }
  }

  @objc private func handleEndCallTap() {
    guard !endCallTapLocked else { return }
    endCallTapLocked = true
    delegate?.pipWidgetDidTapEndCall()
  }
}
