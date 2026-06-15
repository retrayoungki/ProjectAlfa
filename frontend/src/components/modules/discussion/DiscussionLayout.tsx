import React, { useState, useEffect } from 'react';
import { useTeamQuery } from '../../../hooks/useTeam';
import { useChannels } from '../../../hooks/useDiscussion';
import { discussionService } from '../../../services/discussionService';
import SidebarLeft from './SidebarLeft';
import ChatWindow from './ChatWindow';
import SidebarRight from './RightSidebar';
import ThreadPanel from './ThreadPanel';

interface DiscussionLayoutProps {
  projectId: string;
}

export default function DiscussionLayout({ projectId }: DiscussionLayoutProps) {
  // Fetch team members
  const { data: users = [] } = useTeamQuery();
  
  // Simulated user state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Set default current user once users are loaded
  useEffect(() => {
    if (users.length > 0 && !currentUser) {
      // Find a PM or default to first
      const pm = users.find(u => u.role === 'PROJECT_MANAGER' || u.role === 'PM') || users[0];
      setCurrentUser(pm);
    }
  }, [users, currentUser]);

  // Fetch channels
  const { data: channels = [], refetch: refetchChannels, isLoading: isLoadingChannels } = useChannels(projectId);
  const [activeChannel, setActiveChannel] = useState<any>(null);

  // Auto-seed default channels if none exist
  useEffect(() => {
    const seedChannels = async () => {
      if (!isLoadingChannels && channels.length === 0) {
        const defaults = [
          'General Discussion',
          'Site Coordination',
          'Material Coordination',
          'Technical Discussion',
          'Safety & QC',
          'Financial Coordination',
          'Urgent Issues'
        ];
        for (const name of defaults) {
          try {
            await discussionService.createChannel({
              projectId,
              name,
              type: 'PUBLIC'
            });
          } catch (err) {
            console.error("Seeding error for channel:", name, err);
          }
        }
        refetchChannels();
      }
    };
    seedChannels();
  }, [channels, isLoadingChannels, projectId, refetchChannels]);

  // Set active channel to first public channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels, activeChannel]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, pinned, decisions, mentions

  // Thread state
  const [activeThread, setActiveThread] = useState<any>(null);

  if (!currentUser) {
    return <div className="card card-pad text-center">Loading Collaboration Hub...</div>;
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '240px 1fr 280px', 
      height: 'calc(100vh - 180px)', 
      background: 'var(--surface)', 
      borderRadius: 12, 
      border: '1px solid var(--border)', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <SidebarLeft 
        channels={channels} 
        activeChannel={activeChannel} 
        setActiveChannel={setActiveChannel}
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        projectId={projectId}
        refetchChannels={refetchChannels}
      />
      
      <ChatWindow 
        activeChannel={activeChannel}
        currentUser={currentUser}
        users={users}
        onOpenThread={setActiveThread}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        projectId={projectId}
      />

      <SidebarRight 
        projectId={projectId}
        users={users}
        activeChannel={activeChannel}
        onOpenThread={setActiveThread}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      {activeThread && (
        <ThreadPanel 
          parentMessage={activeThread} 
          currentUser={currentUser}
          onClose={() => setActiveThread(null)}
        />
      )}
    </div>
  );
}
