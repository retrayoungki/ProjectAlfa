import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '../../hooks/useTasks';
import TaskBoard from '../../components/modules/tasks/TaskBoard';
import TaskModal from '../../components/modules/tasks/TaskModal';

export default function Tasks() {
  const { data: tasks = [], isLoading, isError } = useTasksQuery();
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  const [modalOpen, setModalOpen] = useState(false);
  // Optional: when clicking "Add card" inside a specific column, default to that column
  const [defaultStatus, setDefaultStatus] = useState('TODO');

  const handleOpenModal = (status = 'TODO') => {
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const handleCreateTask = (data) => {
    createTask.mutate(data, {
      onSuccess: () => setModalOpen(false)
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    updateTask.mutate({ id, status: newStatus });
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Drag & drop to move tasks</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal('TODO')}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tasks...</div>
      ) : isError ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--red)' }}>Error loading tasks. Please ensure the backend is running.</div>
      ) : (
        <TaskBoard 
          tasks={tasks}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleOpenModal}
        />
      )}

      {modalOpen && (
        <TaskModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateTask}
          defaultStatus={defaultStatus}
        />
      )}
    </div>
  );
}
