"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState, useFormStatus } from 'react-dom'
import { signup } from '@/app/auth/actions'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupForm() {
    const router = useRouter()
    const initialState = {
        message: '',
        success: false
    }

    const [formState, formAction] = useFormState(signup, initialState)
    const { pending } = useFormStatus()

    useEffect(() => {
        if (formState.success) {
            router.push('/subscribe')
        }
    }, [formState.success, router])

    return (
        <form action={formAction}>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    name="name"
                    required
                />
            </div>
            <div className="grid gap-2 mt-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    name="email"
                    required
                />
            </div>
            <div className="grid gap-2 mt-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                />
            </div>
            <Button className="w-full mt-4" type="submit" aria-disabled={pending}>
                {pending ? 'Submitting...' : 'Sign up'}
            </Button>
            {formState?.message && !formState.success && (
                <pre className="text-sm text-red-500 bg-red-50 p-2 rounded mt-4 overflow-auto max-h-40">
                    {formState.message}
                </pre>
            )}
        </form>
    )
}