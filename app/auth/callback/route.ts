import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { createStripeCustomer } from '@/utils/stripe/api'
import { db } from '@/utils/db/db'
import { usersTable } from '@/utils/db/schema'
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = requestUrl.searchParams.get('next') ?? '/'

    if (code) {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && user && user.email) {
            // Check if user already exists in our database
            const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, user.email))
            
            if (!existingUser.length) {
                // Create new Stripe customer - ensure all values are defined
                const stripeCustomerId = await createStripeCustomer(
                    user.id || '', 
                    user.email, 
                    user.user_metadata?.name || ''
                )
                
                // Create user record in our database with non-null values
                await db.insert(usersTable).values({
                    id: user.id || crypto.randomUUID(), // Fallback if id is undefined
                    email: user.email,
                    name: user.user_metadata?.name || 'Anonymous',
                    plan: 'none',
                    stripe_id: stripeCustomerId
                })
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${requestUrl.origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${requestUrl.origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
}