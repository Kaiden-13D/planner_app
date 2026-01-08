'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface UserData {
    email: string;
    nickname: string;
}

export default function SettingsPage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nickname, setNickname] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => { fetchUser(); }, []);

    async function fetchUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData({
                    email: user.email || '',
                    nickname: user.user_metadata?.nickname || '',
                });
                setNickname(user.user_metadata?.nickname || '');
            }
        } catch {
            console.error('Failed to fetch user');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateNickname(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { nickname: nickname.trim() },
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('닉네임이 변경되었습니다');
                setUserData(prev => prev ? { ...prev, nickname: nickname.trim() } : null);
            }
        } catch {
            setError('저장 중 오류가 발생했습니다');
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('비밀번호가 변경되었습니다');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch {
            setError('저장 중 오류가 발생했습니다');
        } finally {
            setSaving(false);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    }

    if (loading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">⚙️ 계정 설정</h1>
                <p className="page-subtitle">계정 정보를 관리하세요</p>
            </div>

            {/* 알림 메시지 */}
            {error && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)' }}>
                    {error}
                </div>
            )}
            {message && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)' }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gap: '24px' }}>
                {/* 프로필 정보 */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>👤 프로필 정보</h3>
                    <form onSubmit={handleUpdateNickname}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">이메일</label>
                            <input className="input" type="email" value={userData?.email || ''} disabled style={{ opacity: 0.7 }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>이메일은 변경할 수 없습니다</p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">닉네임</label>
                            <input className="input" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" maxLength={20} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? '저장 중...' : '닉네임 저장'}
                        </button>
                    </form>
                </div>

                {/* 비밀번호 변경 */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>🔒 비밀번호 변경</h3>
                    <form onSubmit={handleUpdatePassword}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">새 비밀번호</label>
                            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="6자 이상" minLength={6} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">새 비밀번호 확인</label>
                            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="비밀번호 다시 입력" />
                        </div>
                        <button type="submit" className="btn btn-secondary" disabled={saving || !newPassword}>
                            {saving ? '저장 중...' : '비밀번호 변경'}
                        </button>
                    </form>
                </div>

                {/* 계정 관리 */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>🚪 계정 관리</h3>
                    <button onClick={handleLogout} className="btn btn-danger">
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
}
