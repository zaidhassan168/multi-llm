"use client"

import React from 'react'
import Lottie from 'lottie-react'
import loadingAnimation from '../public/lottie/loading.json'

interface LottieLoadingProps {
  size?: 'small' | 'large'
}

export default function LottieLoading({ size = 'small' }: LottieLoadingProps) {
  const dimension = size === 'small' ? 100 : 200

  return (
    <div className="flex items-center justify-center" aria-label={`${size} loading indicator`}>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: dimension, height: dimension }}
      />
    </div>
  )
}