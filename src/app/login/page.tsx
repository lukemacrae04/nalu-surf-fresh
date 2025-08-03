'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../supabase'

function Login() {
  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-md mx-auto pt-20">
        <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">
          🏄‍♂️ Welcome to Nalu
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={['google']}
          />
        </div>
      </div>
    </div>
  )
}

export default Login