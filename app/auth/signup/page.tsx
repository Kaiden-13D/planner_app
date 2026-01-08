'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
        }
    }

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                padding: '20px',
            }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <span style={{ fontSize: '4rem' }}>✉️</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '16px' }}>
                        이메일을 확인하세요!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                        {email}로 확인 링크를 보냈습니다.<br />
                        이메일의 링크를 클릭하여 가입을 완료하세요.
                    </p>
                    <Link href="/auth/login">
                        <button className="btn btn-primary" style={{ marginTop: '24px' }}>
                            로그인 페이지로
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '20px',
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <span style={{ fontSize: '3rem' }}>🧠</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '12px' }}>
                        회원가입
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        지식 부채 관리를 시작하세요
                    </p>
                </div>

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">이메일</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">비밀번호</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="6자 이상"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="label">비밀번호 확인</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="비밀번호 다시 입력"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'var(--danger-soft)',
                            color: 'var(--danger)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '0.9rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                }}>
                    이미 계정이 있으신가요?{' '}
                    <Link href="/auth/login" style={{ color: 'var(--accent-primary)' }}>
                        로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
