/**
 * Web recorder utility.
 * Captures audio via MediaRecorder (webm/opus) and video frames as JPEG base64.
 * Mirrors Android recording.tsx behaviour: frames every 10s, max 12 min.
 */

export interface RecordingResult {
  audioBase64: string
  frames: string[]
  actualSeconds: number
}

export class SpeakRecorder {
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private frames: string[] = []
  private frameInterval: ReturnType<typeof setInterval> | null = null
  private startTime: number = 0
  private videoEl: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 640
    this.canvas.height = 480
  }

  async init(videoElement: HTMLVideoElement): Promise<void> {
    this.videoEl = videoElement
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    })
    videoElement.srcObject = this.stream
    videoElement.muted = true
    await videoElement.play()
  }

  async switchCamera(currentFacing: 'user' | 'environment'): Promise<'user' | 'environment'> {
    const newFacing = currentFacing === 'user' ? 'environment' : 'user'
    if (this.stream) {
      this.stream.getVideoTracks().forEach(t => t.stop())
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: newFacing, width: { ideal: 640 }, height: { ideal: 480 } },
    })
    const audioTrack = this.stream?.getAudioTracks()[0]
    if (audioTrack) newStream.addTrack(audioTrack)
    this.stream = newStream
    if (this.videoEl) {
      this.videoEl.srcObject = newStream
    }
    return newFacing
  }

  start(): void {
    if (!this.stream) throw new Error('Stream not initialised. Call init() first.')
    this.audioChunks = []
    this.frames = []
    this.startTime = Date.now()

    // Audio-only track for the recorder
    const audioStream = new MediaStream(this.stream.getAudioTracks())
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    this.mediaRecorder = new MediaRecorder(audioStream, { mimeType })
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data)
    }
    this.mediaRecorder.start(1000) // collect chunks every 1s

    // Capture a frame every 10 seconds (max 3 frames for vision API)
    this.frameInterval = setInterval(() => {
      if (this.frames.length < 3) {
        this.captureFrame()
      }
    }, 10_000)

    // Capture first frame immediately after short delay
    setTimeout(() => this.captureFrame(), 500)
  }

  private captureFrame(): void {
    if (!this.videoEl || this.frames.length >= 3) return
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(this.videoEl, 0, 0, this.canvas.width, this.canvas.height)
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.7)
    const base64 = dataUrl.split(',')[1]
    this.frames.push(base64)
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('Not recording'))

      const actualSeconds = Math.round((Date.now() - this.startTime) / 1000)

      if (this.frameInterval) {
        clearInterval(this.frameInterval)
        this.frameInterval = null
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' })
          const audioBase64 = await blobToBase64(blob)
          resolve({
            audioBase64,
            frames: this.frames,
            actualSeconds,
          })
        } catch (err) {
          reject(err)
        }
      }

      this.mediaRecorder.stop()
    })
  }

  destroy(): void {
    if (this.frameInterval) clearInterval(this.frameInterval)
    this.stream?.getTracks().forEach(t => t.stop())
    this.stream = null
    this.mediaRecorder = null
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
