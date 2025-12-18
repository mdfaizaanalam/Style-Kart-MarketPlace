"use client"
import Common from '@/components/CommonPage/Common'
import ReturnOrder from '@/components/Orders/ReturnOrder'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
      <Common Component={ReturnOrder}/>
    </Suspense>
  )
}

export default page
