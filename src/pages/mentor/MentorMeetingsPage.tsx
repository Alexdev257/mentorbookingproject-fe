import React, { useEffect, useMemo, useState } from 'react';
import { bookingApi } from '../../api/booking';
import { meetingApi } from '../../api/meetings';
import { transcriptApi } from '../../api/transcripts';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, MeetingDetailDto, MeetingRecordingDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Calendar, Link as LinkIcon, Loader2, Video, FileText } from 'lucide-react';

type MeetingBundle = {
  meeting?: MeetingDetailDto;
  recordings: MeetingRecordingDto[];
};

type TranscriptViewState = {
  loading: boolean;
  text?: string;
  summary?: string;
  found: boolean;
};

function isVideoMp4(contentType?: string): boolean {
  return normalize(contentType) === 'video/mp4';
}

function normalize(s?: string): string {
  return (s ?? '').trim().toLowerCase();
}

function extractTranscriptText(detail: { cleanText?: string; rawText?: string; segments?: Array<{ text?: string }> }): string | undefined {
  if (detail.cleanText?.trim()) return detail.cleanText.trim();
  if (detail.rawText?.trim()) return detail.rawText.trim();
  if (detail.segments?.length) {
    const text = detail.segments.map((s) => s.text?.trim()).filter(Boolean).join(' ');
    return text || undefined;
  }
  return undefined;
}

function extractSummary(summary: unknown): string | undefined {
  if (!summary || typeof summary !== 'object') return undefined;
  const value = (summary as { summary?: string; Summary?: string }).summary ?? (summary as { Summary?: string }).Summary;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const MentorMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, MeetingBundle>>({});
  const [transcriptByRecording, setTranscriptByRecording] = useState<Record<string, TranscriptViewState>>({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const bookingRes = await bookingApi.getMentorBookings(user.id, 1, 80);
        const rows = bookingRes.isSuccess ? bookingRes.data?.items ?? [] : [];
        if (cancelled) return;
        setBookings(rows);

        const targetIds = rows
          .filter((b) => b.status === BookingStatus.Confirmed || b.status === BookingStatus.Completed)
          .map((b) => b.id);

        const entries = await Promise.all(
          targetIds.map(async (bookingId) => {
            try {
              const [meetingRes, recordingsRes] = await Promise.all([
                meetingApi.getMeetingByBookingId(bookingId),
                meetingApi.getRecordingsByBookingId(bookingId),
              ]);
              return [
                bookingId,
                {
                  meeting: meetingRes.isSuccess ? meetingRes.data : undefined,
                  recordings: recordingsRes.isSuccess ? recordingsRes.data ?? [] : [],
                },
              ] as const;
            } catch {
              return [bookingId, { meeting: undefined, recordings: [] }] as const;
            }
          })
        );
        if (cancelled) return;
        setMeetingByBooking(Object.fromEntries(entries));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const rows = useMemo(
    () => bookings.filter((b) => b.status === BookingStatus.Confirmed || b.status === BookingStatus.Completed),
    [bookings]
  );

  useEffect(() => {
    const recordings = Object.values(meetingByBooking).flatMap((x) => x.recordings);
    if (!recordings.length) return;

    const unresolved = recordings.filter((r) => transcriptByRecording[r.id] === undefined);
    if (!unresolved.length) return;

    let cancelled = false;
    void (async () => {
      try {
        const listRes = await transcriptApi.getList(1, 100);
        const list = listRes.isSuccess ? listRes.data ?? [] : [];
        if (cancelled) return;

        for (const recording of unresolved) {
          if (!isVideoMp4(recording.contentType)) {
            try {
              const res = await fetch(recording.storageUrl);
              const text = res.ok ? (await res.text()).trim() : '';
              if (!cancelled) {
                setTranscriptByRecording((prev) => ({
                  ...prev,
                  [recording.id]: { loading: false, found: true, text: text || 'Transcript trống.' },
                }));
              }
            } catch {
              if (!cancelled) {
                setTranscriptByRecording((prev) => ({ ...prev, [recording.id]: { loading: false, found: false } }));
              }
            }
            continue;
          }

          const titleMatch = list.find((t) => {
            const title = normalize(t.title);
            const rid = normalize(recording.id);
            const shortId = rid.slice(0, 8);
            const fileName = normalize(decodeURIComponent(recording.storageUrl.split('/').pop() ?? '')).replace(/\.[a-z0-9]+$/, '');
            return title.includes(rid) || title.includes(shortId) || (fileName && title.includes(fileName));
          });

          if (!titleMatch) {
            setTranscriptByRecording((prev) => ({ ...prev, [recording.id]: { loading: false, found: false } }));
            continue;
          }

          setTranscriptByRecording((prev) => ({ ...prev, [recording.id]: { loading: true, found: true } }));
          const detailRes = await transcriptApi.getById(titleMatch.id);
          if (cancelled) return;

          if (!detailRes.isSuccess || !detailRes.data) {
            setTranscriptByRecording((prev) => ({ ...prev, [recording.id]: { loading: false, found: false } }));
            continue;
          }

          const text = extractTranscriptText(detailRes.data);
          const summary = extractSummary(detailRes.data.summary);
          setTranscriptByRecording((prev) => ({
            ...prev,
            [recording.id]: { loading: false, found: true, text, summary },
          }));
        }
      } catch {
        if (cancelled) return;
        for (const recording of unresolved) {
          setTranscriptByRecording((prev) => ({ ...prev, [recording.id]: { loading: false, found: false } }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meetingByBooking, transcriptByRecording]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Mentor"
        title="Meetings & Recordings"
        description="Xem trực tiếp recording và transcript ngay trên trang, không cần mở link ngoài."
        actions={<span className="admin-chip">{loading ? '…' : `${rows.length} meeting`}</span>}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={36} />
        </div>
      ) : rows.length === 0 ? (
        <div className="admin-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Chưa có booking đã xác nhận/hoàn thành để hiển thị meeting.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {rows.map((b) => {
            const bundle = meetingByBooking[b.id];
            const meeting = bundle?.meeting;
            const isFinished = meeting?.status === 2;
            const hostUrl = !isFinished ? meeting?.hostUrl : undefined;
            const recordings = bundle?.recordings ?? [];
            const isCompleted = b.status === 4; // BookingStatus.Completed
            return (
              <div key={b.id} className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  background: isCompleted
                    ? 'linear-gradient(90deg, rgba(63,185,80,0.06) 0%, transparent 60%)'
                    : 'linear-gradient(90deg, rgba(88,166,255,0.06) 0%, transparent 60%)',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{b.topic || 'Mentoring session'}</span>
                      <span className={`status-badge ${isCompleted ? 'status-active' : 'status-pending'}`}>
                        {isCompleted ? 'Hoàn thành' : 'Đã xác nhận'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} />
                      {new Date(b.scheduleStart).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {hostUrl ? (
                      <a href={hostUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                        <LinkIcon size={14} /> Vào Zoom (Host)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isFinished ? 'Meeting đã kết thúc' : 'Chưa có host URL'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Recordings */}
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{
                    fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem',
                  }}>
                    Recordings ({recordings.length})
                  </div>
                  {recordings.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Chưa có recording.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {recordings.slice(0, 3).map((r) => {
                        const t = transcriptByRecording[r.id];
                        return (
                          <div key={r.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.02)' }}>
                              <Video size={13} />
                              {new Date(r.createdAt).toLocaleString('vi-VN')}
                              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.contentType || 'unknown'}</span>
                            </div>
                            <div style={{ padding: '0.75rem 0.85rem' }}>
                              {isVideoMp4(r.contentType) ? (
                                <video controls preload="metadata" src={r.storageUrl} style={{ width: '100%', maxHeight: 340, borderRadius: 6, background: '#000', marginBottom: '0.75rem' }} />
                              ) : null}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                <FileText size={14} /> Transcript
                              </div>
                              {!t || t.loading ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Loader2 size={14} className="animate-spin" /> Đang tải transcript…
                                </div>
                              ) : !t.found ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Chưa có transcript cho recording này.</div>
                              ) : (
                                <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                                  {t.summary ? (
                                    <div style={{ marginBottom: '0.6rem', padding: '0.6rem 0.85rem', borderRadius: 8, background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.15)' }}>
                                      <strong style={{ color: 'var(--brand-primary)' }}>Tóm tắt:</strong>
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>{t.summary}</span>
                                    </div>
                                  ) : null}
                                  <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{t.text || 'Transcript trống.'}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorMeetingsPage;
