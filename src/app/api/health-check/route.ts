import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check external API health
    const response = await fetch('https://api-ai-blog-writer-613248238610.us-east1.run.app/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return NextResponse.json({ 
        status: 'connected',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        status: 'error',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
