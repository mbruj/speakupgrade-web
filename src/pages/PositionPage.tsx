import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export default function PositionPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [hideCamera, setHideCamera] = useState(false)
  const isMobile = isMobileDevice()

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cameras = devices.filter((d) => d.kind === 'videoinput')
      setHasMultipleCameras(cameras.length > 1)
    }).catch(() => {})

    startCamera('user')

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startCamera = async (facingMode: 'user' | 'environment') => {
    setReady(false)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const constraints: MediaStreamConstraints = {
        video: isMobile
          ? { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play()
      }
      setReady(true)
    } catch (err) {
      console.error('Camera error:', err)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true
          await videoRef.current.play()
        }
        setReady(true)
      } catch (err2) {
        console.error('Camera fallback error:', err2)
      }
    }
  }

  const switchCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    await startCamera(next)
  }

  const goToRecording = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    navigate('/recording', { state: { facing, hideCamera } })
  }

  const startCountdown = () => {
    if (!ready) return
    setCountdown(10)
    let current = 10
    countdownRef.current = setInterval(() => {
      current -= 1
      if (current <= 0) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
        setCountdown(null)
        streamRef.current?.getTracks().forEach((t) => t.stop())
        navigate('/recording', { state: { facing, hideCamera } })
      } else {
        setCountdown(current)
      }
    }, 1000)
  }

  const cameraButtonLabel = () => {
    if (!isMobile) return null
    if (!hasMultipleCameras) return null
    return facing === 'user' ? 'Back camera' : 'Front camera'
  }

  const switchLabel = cameraButtonLabel()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>

      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: facing === 'user' ? 'scaleX(-1)' : 'none',
          opacity: hideCamera ? 0 : 1,
        }}
      />

      {/* Black screen when camera hidden on position page */}
      {hideCamera && (
        <div style={{ position: 'absolute', inset: 0, background: '#000' }} />
      )}

      {/* Corner brackets */}
      {(['tl','tr','bl','br'] as const).map((pos) => (
        <div key={pos} style={{
          position: 'absolute',
          top: pos.startsWith('t') ? 40 : undefined,
          bottom: pos.startsWith('b') ? 40 : undefined,
          left: pos.endsWith('l') ? 20 : undefined,
          right: pos.endsWith('r') ? 20 : undefined,
          width: 28, height: 28,
          borderTop: pos.startsWith('t') ? '3px solid rgba(255,255,255,0.6)' : undefined,
          borderBottom: pos.startsWith('b') ? '3px solid rgba(255,255,255,0.6)' : undefined,
          borderLeft: pos.endsWith('l') ? '3px solid rgba(255,255,255,0.6)' : undefined,
          borderRight: pos.endsWith('r') ? '3px solid rgba(255,255,255,0.6)' : undefined,
        }} />
      ))}

      {/* Countdown overlay */}
      {countdown !== null && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
        }}>
          <div style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            border: '3px solid #3B82F6',
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{countdown}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.12em', marginTop: 4 }}>GET READY</span>
          </div>

          {/* Skip button during countdown */}
          <button
            onClick={goToRecording}
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              padding: '10px 32px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
            }}
          >
            Skip
          </button>
        </div>
      )}

      {/* Bottom bar — hidden during countdown */}
      {countdown === null && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(12px)',
          padding: '20px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Instruction */}
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
              Position yourself in the <span style={{ color: '#3B82F6' }}>center</span>
            </p>
            <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>
              {isMobile ? 'Stand 1.5-2m from camera. Full body visible.' : 'Position yourself clearly in frame.'}
            </p>
          </div>

          {/* Camera preference toggle */}
          <button
            onClick={() => setHideCamera(h => !h)}
            style={{
              background: hideCamera ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hideCamera ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'inherit',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${hideCamera ? '#3B82F6' : 'rgba(255,255,255,0.3)'}`,
              background: hideCamera ? '#3B82F6' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {hideCamera && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: 0 }}>I prefer not to see myself</p>
              <p style={{ fontSize: 11, color: '#71717a', margin: 0, marginTop: 1 }}>Camera still used for body language analysis</p>
            </div>
          </button>

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {switchLabel && (
              <button
                onClick={switchCamera}
                style={{
                  flex: 1,
                  background: '#2A2A2E',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '13px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {switchLabel}
              </button>
            )}
            <button
              onClick={startCountdown}
              disabled={!ready}
              style={{
                flex: switchLabel ? 1 : undefined,
                width: switchLabel ? undefined : '100%',
                background: '#3B82F6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                padding: '13px 28px',
                borderRadius: 12,
                border: 'none',
                cursor: ready ? 'pointer' : 'not-allowed',
                opacity: ready ? 1 : 0.5,
                fontFamily: 'inherit',
              }}
            >
              Ready
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
