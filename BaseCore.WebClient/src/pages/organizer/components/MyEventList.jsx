import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/ui/StatusBadge';
import { fmt, parseApiDate } from '../../../utils/format';

export function EventFilters({ filters, selectedFilter, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {filters.map((filter) => {
        const isActive = selectedFilter === filter.key;

        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onSelect(filter.key)}
            style={{
              padding: '5px 14px', borderRadius: 999, border: 'none',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--c-ink)' : 'rgba(15,15,15,0.05)',
              color: isActive ? '#fff' : 'rgba(15,15,15,0.60)',
              cursor: 'pointer', transition: 'all 0.12s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {filter.label}
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: isActive ? 'rgba(255,255,255,0.20)' : 'rgba(15,15,15,0.10)',
              color: isActive ? '#fff' : 'rgba(15,15,15,0.55)',
              borderRadius: 8, padding: '1px 6px',
            }}>
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function isEventInProgress(event) {
  return event.status === 'Approved'
    && parseApiDate(event.startDate) <= new Date()
    && parseApiDate(event.endDate) > new Date();
}

function hasEventEnded(event) {
  return event.status === 'Approved' && parseApiDate(event.endDate) <= new Date();
}

function EventCard({ event, resubmittingId, onDelete, onResubmit, onEditPending }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
        background: '#fff', borderRadius: 12,
        border: '1px solid var(--c-border)',
        transition: 'border-color 0.12s',
      }}
      className="flex-col sm:flex-row sm:items-center"
    >
      <div style={{
        width: 80, height: 80, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
        background: 'rgba(27,97,201,0.06)', border: '1px solid var(--c-border)',
      }}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fa-solid fa-calendar-days" style={{ color: 'rgba(27,97,201,0.35)', fontSize: 22 }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-ink)' }}>{event.title}</span>
          <StatusBadge status={event.status} />
          {isEventInProgress(event) && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 999,
              background: 'rgba(180,83,9,0.10)', color: '#b45309',
            }}>Đang diễn ra</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(15,15,15,0.50)', flexWrap: 'wrap' }}>
          <span><i className="fa-solid fa-calendar mr-1" />{fmt(event.startDate)}</span>
          {event.location && <span><i className="fa-solid fa-location-dot mr-1" />{event.location}</span>}
          <span><i className="fa-solid fa-users mr-1" />{event.currentParticipants}/{event.maxParticipants}</span>
        </div>
        {hasEventEnded(event) && (
          <p style={{ fontSize: 12, color: '#b45309', marginTop: 4, fontWeight: 500 }}>
            <i className="fa-solid fa-triangle-exclamation mr-1" />Sự kiện đã kết thúc — hãy hoàn thành hoặc hủy.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        {(event.status === 'Approved' || event.status === 'Completed' || event.status === 'Cancelled') && (
          <Link to={`/events/${event.id}/manage`} className="btn-secondary btn-sm flex items-center gap-1">
            <i className="fa-solid fa-list-check" /> Quản lý
          </Link>
        )}

        {event.status !== 'Completed' && event.status !== 'Cancelled' && (
          event.status === 'Pending' ? (
            <button type="button" onClick={() => onEditPending(event.id)} className="btn-secondary btn-sm flex items-center gap-1">
              <i className="fa-solid fa-pen" /> Sửa
            </button>
          ) : (
            <Link to={`/events/${event.id}/edit`} className="btn-secondary btn-sm flex items-center gap-1">
              <i className="fa-solid fa-pen" /> Sửa
            </Link>
          )
        )}

        {event.status === 'Rejected' && (
          <button type="button" onClick={() => onResubmit(event.id)} disabled={resubmittingId === event.id} className="btn-primary btn-sm flex items-center gap-1">
            {resubmittingId === event.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
            Gửi duyệt lại
          </button>
        )}

        {event.status === 'Pending' && (
          <button type="button" onClick={() => onDelete(event.id)} className="btn-danger btn-sm flex items-center gap-1">
            <i className="fa-solid fa-trash" />
          </button>
        )}
      </div>
    </div>
  );
}

export function EventList({ events, resubmittingId, onDelete, onResubmit, onEditPending }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          resubmittingId={resubmittingId}
          onDelete={onDelete}
          onResubmit={onResubmit}
          onEditPending={onEditPending}
        />
      ))}
    </div>
  );
}
