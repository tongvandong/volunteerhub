import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { eventApi } from '../../services/api';
import { EventFilters, EventList } from './components/MyEventList';

function getEventCounts(events) {
  return {
    all: events.length,
    Pending: events.filter((event) => event.status === 'Pending').length,
    Approved: events.filter((event) => event.status === 'Approved').length,
    Completed: events.filter((event) => event.status === 'Completed').length,
    Rejected: events.filter((event) => event.status === 'Rejected').length,
    Cancelled: events.filter((event) => event.status === 'Cancelled').length,
  };
}

function getEventFilters(counts) {
  return [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'Pending', label: 'Chờ duyệt', count: counts.Pending },
    { key: 'Approved', label: 'Đang mở', count: counts.Approved },
    { key: 'Completed', label: 'Hoàn thành', count: counts.Completed },
    { key: 'Rejected', label: 'Bị từ chối', count: counts.Rejected },
    { key: 'Cancelled', label: 'Đã hủy', count: counts.Cancelled },
  ];
}

function getVisibleEvents(events, filter) {
  if (filter === 'all') {
    return events;
  }

  return events.filter((event) => event.status === filter);
}

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [resubmittingId, setResubmittingId] = useState(null);

  useEffect(() => {
    eventApi.getMine()
      .then((response) => setEvents(response.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(eventId) {
    if (!window.confirm('Xóa sự kiện này?')) {
      return;
    }

    try {
      await eventApi.delete(eventId);
      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
    } catch (error) {
      alert(error.response?.data?.message || 'Xóa thất bại');
    }
  }

  async function handleResubmit(eventId) {
    setResubmittingId(eventId);

    try {
      const response = await eventApi.resubmit(eventId);
      setEvents((currentEvents) => currentEvents.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        return { ...event, ...response.data, status: 'Pending' };
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'Gửi duyệt lại thất bại');
    } finally {
      setResubmittingId(null);
    }
  }

  function handleEditPending(eventId) {
    const accepted = window.confirm('Sự kiện đang chờ admin duyệt. Sửa sẽ cần gửi duyệt lại. Bạn muốn tiếp tục?');

    if (accepted) {
      navigate(`/events/${eventId}/edit`);
    }
  }

  const counts = getEventCounts(events);
  const filters = getEventFilters(counts);
  const visibleEvents = getVisibleEvents(events, filter);
  const selectedFilter = filters.find((item) => item.key === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--c-ink)', margin: 0 }}>Sự kiện của tôi</h1>
          <p style={{ fontSize: 13, color: 'rgba(15,15,15,0.50)', marginTop: 2 }}>{counts.all} sự kiện tổng cộng</p>
        </div>
        <Link to="/events/create" className="btn-primary flex items-center gap-2">
          <i className="fa-solid fa-circle-plus" /> Tạo sự kiện
        </Link>
      </div>

      <EventFilters filters={filters} selectedFilter={filter} onSelect={setFilter} />

      {loading ? <LoadingSpinner /> : visibleEvents.length === 0 ? (
        <EmptyState
          icon="fa-calendar-xmark"
          title="Chưa có sự kiện nào"
          description={filter === 'all'
            ? 'Tạo sự kiện đầu tiên để bắt đầu quản lý tình nguyện viên.'
            : `Không có sự kiện nào ở trạng thái "${selectedFilter?.label}".`}
          cta={filter === 'all' ? 'Tạo sự kiện' : undefined}
          ctaTo={filter === 'all' ? '/events/create' : undefined}
        />
      ) : (
        <EventList
          events={visibleEvents}
          resubmittingId={resubmittingId}
          onDelete={handleDelete}
          onResubmit={handleResubmit}
          onEditPending={handleEditPending}
        />
      )}
    </div>
  );
}
