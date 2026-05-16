import React from 'react';
import { Link } from 'react-router-dom';

const ContextPanel = ({ activeConversation, currentUser, projects, workers }) => {
  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const project = projects?.find(p => p.id === activeConversation.projectId);
  
  // Find other participant for direct messages
  const otherParticipantId = !isGroup ? activeConversation.participants.find(id => id !== currentUser.id) : null;
  const otherParticipant = otherParticipantId ? workers?.find(w => w.id === otherParticipantId || w.userId === otherParticipantId) : null;
  const otherName = activeConversation.participantNames?.[otherParticipantId] || 'Unknown User';

  return (
    <div className="w-[300px] bg-white border-l border-slate-200 h-[calc(100vh-64px)] hidden lg:flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-200 flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-sm mb-4
          ${isGroup ? 'bg-emerald-500' : 'bg-primary'}`}
        >
          {isGroup ? <span className="material-symbols-outlined text-4xl">group</span> : otherName.substring(0, 2).toUpperCase()}
        </div>
        <h3 className="font-headline-md text-slate-900 font-black mb-1">
          {isGroup ? activeConversation.name : otherName}
        </h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
          {isGroup ? 'Project Group' : (otherParticipant?.role || 'Team Member')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Project Context */}
        {isGroup && project && (
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Project Context</h4>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="font-bold text-sm text-slate-900 mb-1">{project.name}</div>
              <div className="text-xs text-slate-500 mb-3">{project.code}</div>
              
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-600">Progress</span>
                <span className="font-black text-primary">{project.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
                <div className="bg-primary h-full" style={{ width: `${project.progress}%` }}></div>
              </div>
              
              <Link to="/" className="w-full py-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                View Project
              </Link>
            </div>
          </div>
        )}

        {/* Members */}
        {isGroup && (
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Members ({activeConversation.participants.length})</h4>
            <div className="space-y-3">
              {activeConversation.participants.map(id => {
                const name = activeConversation.participantNames?.[id] || 'Unknown';
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-black">
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{id === currentUser.id ? 'You' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared Files (Placeholder) */}
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Files</h4>
          <div className="text-center p-4 bg-slate-50 rounded border border-slate-100 border-dashed">
            <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">folder_open</span>
            <p className="text-xs text-slate-400 italic">No files shared yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
