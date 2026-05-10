'use client'

import { useState, useEffect, useCallback } from 'react';
import TasksFilterBar from '@/components/technician/TasksFilterBar';
import TasksTable, { TaskRow } from '@/components/technician/TasksTable';
import TasksPagination from '@/components/technician/TasksPagination';

export default function TechnicianTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  // FIXED: BUG #1 — Separated pagination into primitives to prevent re-render loop
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10; // constant — never changes, safe to omit from deps

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // FIXED: BUG #1 — Deps are now stable primitives; no object-reference churn
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString()
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/technician/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();

      setTasks(data.tasks);
      // FIXED: BUG #1 — Use individual setters instead of replacing entire pagination object
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setActiveCount(data.activeCount);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, dateFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilter = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchTasks();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-h1 text-h1 text-on-surface">My Tasks</h1>
        <div className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-label-md">
          {activeCount} Active
        </div>
      </div>

      <TasksFilterBar
        search={search}
        setSearch={(val) => { setSearch(val); setPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={(val) => { setStatusFilter(val); setPage(1); }}
        priorityFilter={priorityFilter}
        setPriorityFilter={(val) => { setPriorityFilter(val); setPage(1); }}
        dateFilter={dateFilter}
        setDateFilter={(val) => { setDateFilter(val); setPage(1); }}
        onFilter={handleFilter}
      />

      <TasksTable tasks={tasks} isLoading={isLoading} />

      {!isLoading && tasks.length > 0 && (
        <TasksPagination
          total={total}
          page={page}
          limit={LIMIT}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
