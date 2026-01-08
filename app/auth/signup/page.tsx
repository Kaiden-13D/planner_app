'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다');
            return;
        }

        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nickname: nickname.trim(),
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('가입 확인 이메일을 발송했습니다. 이메일을 확인해주세요!');
            }
        } catch {
            setError('회원가입 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))',
            padding: '20px',
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '3rem' }}>🧠</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '12px' }}>회원가입</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Knowledge Debt Manager</p>
                </div>

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">닉네임</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="사용할 닉네임"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                            maxLength={20}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">이메일</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="example@email.com"
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
                            minLength={6}
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
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.9rem' }}>
                            {message}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }} disabled={loading}>
                        {loading ? '처리 중...' : '회원가입'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    이미 계정이 있으신가요?{' '}
                    <Link href="/auth/login" style={{ color: 'var(--accent-primary)' }}>로그인</Link>
                </p>
            </div>
        </div>
    );
}
