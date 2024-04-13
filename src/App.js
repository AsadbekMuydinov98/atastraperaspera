import { useRef, useEffect, useState } from 'react'
import * as posenet from '@tensorflow-models/posenet'
import Webcam from 'react-webcam'
import './App.css'
import { drawKeypoints, drawSkeleton } from './utils'

const App = () => {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [clothingSize, setClothingSize] = useState(null)

  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 680, height: 480 },
    })
    detect(net)
  }

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // get video properties
      const video = webcamRef.current.video
      const videoWidth = webcamRef.current.video.videoWidth
      const videoHeight = webcamRef.current.video.videoHeight
  
      // set video width and height
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight
  
      // make detection
      const pose = await net.estimateSinglePose(video)
  
      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef)

      // Calculate clothing size
      const size = calculateClothingSize(pose)
      setClothingSize(size)
    }
    
    // Call detect again on the next frame
    requestAnimationFrame(() => {
      detect(net)
    })
  }

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext('2d')
    canvas.current.width = videoWidth
    canvas.current.height = videoHeight

    drawKeypoints(pose['keypoints'], 0.5, ctx)
    drawSkeleton(pose['keypoints'], 0.5, ctx)
  }

  const calculateClothingSize = (pose) => {
    // Find relevant keypoints
    const keypoints = pose.keypoints
    const leftShoulder = keypoints.find((point) => point.part === 'leftShoulder')
    const rightShoulder = keypoints.find((point) => point.part === 'rightShoulder')
    const leftHip = keypoints.find((point) => point.part === 'leftHip')
    const rightHip = keypoints.find((point) => point.part === 'rightHip')
  
    // Calculate shoulder width and hip width
    const shoulderWidth = Math.abs(leftShoulder.position.x - rightShoulder.position.x)
    const hipWidth = Math.abs(leftHip.position.x - rightHip.position.x)
  
    // Calculate clothing size
    const size = shoulderWidth + hipWidth / 2.5 // You can adjust this factor
  
    // Determine the clothing size based on the calculated size
    if (size < 100) {
      return 'S'
    } else if (size >= 100 && size < 120) {
      return 'M'
    } else if (size >= 120 && size < 140) {
      return 'L'
    } else {
      return 'XL'
    }
  }

  useEffect(() => {
    runPosenet()

    // eslint-disable-next-line
  }, [])

  console.log(clothingSize);

  return (
    <div className='App'>
      <header className='App-header'>
        <Webcam ref={webcamRef} className='webcam' /> 
        <canvas ref={canvasRef} className='canvas' />
        {clothingSize && <p className='size'>Your Clothing Size: {clothingSize}</p>}
      </header>
    </div>
  )
}

export default App
