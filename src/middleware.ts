import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Temporary pass-through. 
  // Client-side auth in layout.tsx will handle the actual redirects.
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
