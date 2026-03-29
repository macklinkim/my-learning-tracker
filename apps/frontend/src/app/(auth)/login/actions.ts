'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  let errorMsg = '';
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Supabase URL이 설정되지 않았습니다.');
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) {
      errorMsg = error.message;
    }
  } catch (err: any) {
    errorMsg = err.message || '서버 오류가 발생했습니다.';
  }

  if (errorMsg) {
    redirect(`/login?error=${encodeURIComponent(errorMsg)}`)
  }
  redirect('/')
}

export async function signup(formData: FormData) {
  let errorMsg = '';
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Supabase URL이 설정되지 않았습니다.');

    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    if (error) {
      errorMsg = error.message;
    }
  } catch (err: any) {
    errorMsg = err.message || '서버 오류가 발생했습니다.';
  }

  if (errorMsg) {
    redirect(`/signup?error=${encodeURIComponent(errorMsg)}`)
  }
  redirect(`/login?message=${encodeURIComponent('가입 완료. 이메일을 확인하세요.')}`)
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/login')
}
