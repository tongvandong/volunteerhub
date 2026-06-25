import React from 'react';
import Modal from '../../../../components/ui/Modal';

export default function CancelEventModal({ isOpen, onClose, onSubmit, reason, onReasonChange, saving }) {
  const isReasonTooShort = reason.trim().length < 10;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hủy sự kiện" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <i className="fa-solid fa-circle-exclamation mr-1" />
          Hệ thống sẽ dừng nhận đăng ký mới và đánh dấu sự kiện là đã hủy.
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-warmink-2">Lý do hủy *</label>
            <span className={`text-xs ${isReasonTooShort ? 'text-red-500' : 'text-warmink-3'}`}>
              {reason.trim().length}/10 ký tự tối thiểu
            </span>
          </div>
          <textarea
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="input-field resize-none"
            placeholder="Ví dụ: thời tiết xấu, thay đổi kế hoạch, địa điểm không khả dụng..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
          <button type="submit" disabled={saving || isReasonTooShort} className="btn-danger flex items-center gap-2 disabled:opacity-60">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Xác nhận hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}
