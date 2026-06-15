import React from 'react';

interface ProjectModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ProjectModal({ isOpen, title, onClose, children }: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: 460,
          maxWidth: '100%',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          background: 'var(--surface)',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          {title}
        </h3>
        <div>{children}</div>
      </div>
    </div>
  );
}
