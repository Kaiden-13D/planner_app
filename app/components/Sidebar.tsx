'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase-browser';

const navItems = [
    { href: '/', label: '대시보드', icon: '📊' },
    { href: '/goals', label: '목표 관리', icon: '🎯' },
    { href: '/calendar', label: '캘린더', icon: '📅' },
    { href: '/courses', label: '강의 목록', icon: '📚' },
    { href: '/textbooks', label: '교재 목록', icon: '📖' },
    { href: '/questions', label: '질문 로그', icon: '❓' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [nickname, setNickname] = useState('');

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.nickname) {
                setNickname(user.user_metadata.nickname);
            }
        }
        fetchUser();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    }

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <span style={{ fontSize: '1.5rem' }}>🧠</span>
                <h1>Debt Manager</h1>
            </div>

            <div className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            <div style={{
                marginTop: 'auto',
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
            }}>
                {/* 사용자 정보 및 설정 */}
                <Link href="/settings">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        border: pathname === '/settings' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                        }}>
                            {nickname ? nickname.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{nickname || '사용자'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚙️ 계정 설정</p>
                        </div>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    🚪 로그아웃
                </button>
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '12px'
                }}>
                    Knowledge Debt Manager v0.3.0
                </p>
            </div>
        </nav>
    );
}
