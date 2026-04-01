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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((b) => {
            const bundle = meetingByBooking[b.id];
            const meeting = bundle?.meeting;
            const isFinished = meeting?.status === 2;
            const hostUrl = !isFinished ? meeting?.hostUrl : undefined;
            const recordings = bundle?.recordings ?? [];
            return (
              <div key={b.id} className="admin-panel" style={{ padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.topic || 'Mentoring session'}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      {new Date(b.scheduleStart).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {hostUrl ? (
                      <a href={hostUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-primary" style={{ fontSize: '0.8125rem' }}>
                        <LinkIcon size={14} /> Vào Zoom (Host)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {isFinished ? 'Meeting đã kết thúc (ẩn URL Zoom).' : 'Chưa có host URL'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Recording: <strong>{recordings.length}</strong>
                  </div>
                  {recordings.slice(0, 3).map((r) => {
                    const t = transcriptByRecording[r.id];
                    return (
                      <div key={r.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Video size={14} /> {new Date(r.createdAt).toLocaleString('vi-VN')} ({r.contentType || 'unknown'})
                        </div>
                        {isVideoMp4(r.contentType) ? (
                          <video
                            controls
                            preload="metadata"
                            src={r.storageUrl}
                            style={{ width: '100%', maxHeight: 360, borderRadius: 8, background: '#000' }}
                          />
                        ) : null}
                        <div style={{ marginTop: '0.6rem', fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                            <FileText size={14} /> Transcript
                          </div>
                          {!t || t.loading ? (
                            <div style={{ color: 'var(--text-muted)' }}>Đang tải transcript…</div>
                          ) : !t.found ? (
                            <div style={{ color: 'var(--text-muted)' }}>Chưa có transcript cho recording này.</div>
                          ) : (
                            <div style={{ color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {t.summary ? <p style={{ margin: '0 0 0.45rem', color: 'var(--text-secondary)' }}><strong>Tóm tắt:</strong> {t.summary}</p> : null}
                              {t.text ? t.text : 'Transcript trống.'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
