import React, { useEffect, useMemo, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import Modal from './Modal';
import { interviewCallApi } from '../../services/api';
import { fmtDateTime } from '../../utils/format';

export default function InterviewCallModal({ slot, onClose }) {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);
  const loadTimerRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const isOrganizer = payload?.role === 'Organizer' || payload?.canStartCall === true;
  const tokenizedRoomUrl = useMemo(() => {
    if (!payload?.roomUrl) return '';
    if (!payload?.meetingToken) return payload.roomUrl;
    const separator = payload.roomUrl.includes('?') ? '&' : '?';
    return `${payload.roomUrl}${separator}t=${encodeURIComponent(payload.meetingToken)}`;
  }, [payload?.roomUrl, payload?.meetingToken]);

  const clearLoadTimer = () => {
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  };

  const destroyFrame = async () => {
    clearLoadTimer();
    const frame = callFrameRef.current;
    callFrameRef.current = null;
    if (!frame) return;

    try {
      await frame.leave();
    } catch {
      // The participant may already have left.
    }

    try {
      frame.destroy();
    } catch {
      // Ignore cleanup errors so closing the modal never blocks UI.
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!slot?.id || !containerRef.current) return;
      setLoading(true);
      setJoined(false);
      setError('');
      setHint('');

      try {
        const response = await interviewCallApi.getDailyToken(slot.id);
        if (cancelled) return;

        const data = response.data;
        setPayload(data);

        const frame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '16px',
            backgroundColor: '#0f172a',
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          activeSpeakerMode: false,
          theme: {
            colors: {
              accent: '#2563eb',
              accentText: '#ffffff',
              background: '#0f172a',
              backgroundAccent: '#111827',
              baseText: '#ffffff',
            },
          },
        });

        callFrameRef.current = frame;

        frame.on('loaded', () => {
          if (cancelled) return;
          setLoading(false);
          clearLoadTimer();
        });
        frame.on('joining-meeting', () => {
          if (cancelled) return;
          setLoading(false);
          clearLoadTimer();
        });
        frame.on('joined-meeting', () => {
          if (cancelled) return;
          setJoined(true);
          setLoading(false);
          setHint('');
          clearLoadTimer();
        });
        frame.on('left-meeting', () => {
          setJoined(false);
          onClose?.();
        });
        frame.on('camera-error', () => {
          if (cancelled) return;
          setLoading(false);
          setHint('Trình duyệt chưa cấp quyền camera/micro. Hãy cấp quyền hoặc mở phòng bằng tab mới.');
        });
        frame.on('error', (event) => {
          if (cancelled) return;
          setLoading(false);
          setError(event?.errorMsg || event?.message || 'Daily gặp lỗi khi mở phòng phỏng vấn.');
          clearLoadTimer();
        });

        loadTimerRef.current = window.setTimeout(() => {
          if (cancelled || joined) return;
          setLoading(false);
          setHint('Daily đang phản hồi chậm hoặc bị trình duyệt chặn trong iframe. Bạn có thể bấm "Mở bằng tab mới" để vào phòng ngay.');
        }, 12000);

        frame.join({
          url: data.roomUrl,
          token: data.meetingToken,
          userName: data.selfName,
          startVideoOff: false,
          startAudioOff: false,
        }).catch((err) => {
          if (cancelled) return;
          setLoading(false);
          setError(err?.message || 'Không thể mở phòng phỏng vấn Daily.');
          clearLoadTimer();
        });
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(err.response?.data?.message || err.message || 'Không thể mở phòng phỏng vấn Daily.');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      destroyFrame();
    };
  }, [slot?.id]);

  const closeRoom = async () => {
    setClosing(true);
    await destroyFrame();
    setClosing(false);
    onClose?.();
  };

  const statusText = loading
    ? 'Đang mở phòng Daily'
    : joined
      ? 'Đang trong phòng'
      : 'Sẵn sàng vào phòng';

  return (
    <Modal isOpen={!!slot} onClose={closeRoom} title="" size="xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 p-5 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-950/20">
              <i className="fa-solid fa-video" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Phòng phỏng vấn Daily</h2>
              <p className="mt-1 text-sm text-slate-300">{payload?.eventTitle || 'Phỏng vấn trực tuyến'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium ${joined ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30' : 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-300/30'}`}>
              <span className={`h-2 w-2 rounded-full ${joined ? 'bg-emerald-300' : 'bg-amber-300'}`} />
              {statusText}
            </span>
            {payload?.scheduledAt && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-slate-200 ring-1 ring-white/15">
                <i className="fa-regular fa-clock" />
                {fmtDateTime(payload.scheduledAt)} · {payload.durationMinutes || 30} phút
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-0 bg-slate-100 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="bg-slate-950 p-3 sm:p-4">
            {error && (
              <div className="mb-3 rounded-lg border border-red-300/40 bg-red-950/70 p-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {hint && (
              <div className="mb-3 rounded-lg border border-amber-300/40 bg-amber-950/60 p-3 text-sm text-amber-50">
                {hint}
              </div>
            )}
            <div ref={containerRef} className="relative h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black">
              {loading && (
                <div className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-xl border border-white/10 bg-slate-950/85 p-3 text-center text-white shadow-xl backdrop-blur">
                  <div className="flex items-center justify-center gap-3">
                    <i className="fa-solid fa-spinner fa-spin" />
                    <div>
                      <div className="font-medium">Đang kết nối Daily</div>
                      <div className="mt-0.5 text-xs text-slate-300">Nếu Daily hỏi quyền camera/micro, hãy bấm cho phép trong trình duyệt.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4 border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">{payload?.selfName || 'Bạn'}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {isOrganizer ? 'Organizer · chủ phòng' : 'Volunteer · ứng viên'}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              <div className="font-semibold">Cách dùng</div>
              <ul className="mt-2 space-y-1.5 text-xs leading-5">
                <li>Organizer là người mở phòng và điều phối buổi phỏng vấn.</li>
                <li>Volunteer vào đúng giờ và chờ organizer tham gia.</li>
                <li>Không ghi hình mặc định theo cấu hình hiện tại.</li>
                <li>Nếu iframe bị treo do quyền camera/micro, hãy mở bằng tab mới.</li>
              </ul>
            </div>

            {!isOrganizer && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="font-semibold">Chờ nhà tổ chức</div>
                <div className="mt-1 text-xs">Bạn có thể vào trước và chờ organizer tham gia phòng.</div>
              </div>
            )}

            {isOrganizer && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                <div className="font-semibold">Bạn là chủ phòng</div>
                <div className="mt-1 text-xs">Hãy vào phòng trước vài phút để kiểm tra camera, micro và đón volunteer.</div>
              </div>
            )}

            <div className="mt-auto flex flex-col gap-2">
              <button type="button" onClick={closeRoom} disabled={closing} className="btn-secondary w-full">
                {closing ? 'Đang đóng phòng...' : 'Rời phòng'}
              </button>
              {tokenizedRoomUrl && (
                <a href={tokenizedRoomUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-center no-underline">
                  Mở bằng tab mới
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
