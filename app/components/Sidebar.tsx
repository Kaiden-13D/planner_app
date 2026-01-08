'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', label: '대시보드', icon: '📊' },
    { href: '/goals', label: '목표 관리', icon: '🎯' },
    { href: '/lectures', label: '강의', icon: '🎬' },
    { href: '/books', label: '도서', icon: '📚' },
    { href: '/assignments', label: '과제', icon: '📝' },
    { href: '/questions', label: '질문 로그', icon: '❓' },
    { href: '/calendar', label: '캘린더', icon: '📅' },
];

export default function Sidebar() {
    const pathname = usePathname();

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
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
            }}>
                <p>Knowledge Debt Manager</p>
                <p style={{ marginTop: '4px' }}>v0.1.0</p>
            </div>
        </nav>
    );
}
