//
//  VoiceManager.swift
//  InventoryDifferent
//

import Foundation
import Combine
import Speech
import AVFoundation

@MainActor
class VoiceManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var isSpeaking = false
    @Published var transcript = ""
    /// Set to the final transcript when recognition ends naturally (silence/isFinal).
    /// Cleared by the observer after consuming. Not set when stopRecording() is called manually.
    @Published var finalTranscript: String? = nil
    @Published var isSpeakingEnabled = true
    @Published var permissionsGranted = false

    /// Set to true before calling stopRecording() manually to prevent finalTranscript from firing.
    var suppressFinalTranscript = false

    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let synthesizer = AVSpeechSynthesizer()
    private var silenceTimer: Timer?
    private let silenceTimeout: TimeInterval = 1.5

    override init() {
        super.init()
        synthesizer.delegate = self
        requestPermissions()
    }

    private func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { status in
            AVAudioApplication.requestRecordPermission { granted in
                Task { @MainActor in
                    self.permissionsGranted = status == .authorized && granted
                }
            }
        }
    }

    func startRecording() throws {
        recognitionTask?.cancel()
        recognitionTask = nil
        suppressFinalTranscript = false

        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { return }
        recognitionRequest.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode

        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }
            // Single Task so transcript is guaranteed set before stopRecording() runs
            Task { @MainActor in
                if let result {
                    self.transcript = result.bestTranscription.formattedString
                    // Reset silence timer on each new partial result
                    self.silenceTimer?.invalidate()
                    self.silenceTimer = Timer.scheduledTimer(withTimeInterval: self.silenceTimeout, repeats: false) { [weak self] _ in
                        Task { @MainActor in
                            guard let self, self.isRecording else { return }
                            let completed = self.transcript
                            self.stopRecording()
                            if !completed.isEmpty && !self.suppressFinalTranscript {
                                self.finalTranscript = completed
                            }
                            self.suppressFinalTranscript = false
                        }
                    }
                }
                if error != nil || result?.isFinal == true {
                    self.silenceTimer?.invalidate()
                    self.silenceTimer = nil
                    let completed = self.transcript
                    self.stopRecording()
                    if !completed.isEmpty && !self.suppressFinalTranscript {
                        self.finalTranscript = completed
                    }
                    self.suppressFinalTranscript = false
                }
            }
        }

        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        transcript = ""
        isRecording = true
    }

    func stopRecording() {
        silenceTimer?.invalidate()
        silenceTimer = nil
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask = nil
        isRecording = false

        try? AVAudioSession.sharedInstance().setCategory(.playback)
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    func speak(_ text: String) {
        guard isSpeakingEnabled else { return }
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.52
        synthesizer.speak(utterance)
    }

    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}

extension VoiceManager: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = true }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }
}
