import React, { useEffect, useMemo, useState } from 'react';
import { bookingApi } from '../../api/booking';
import { meetingApi } from '../../api/meetings';
import { transcriptApi } from '../../api/transcripts';
import { useAuth } from '../../contexts/AuthContext';
import type { BookingResponseDto, MeetingDetailDto, MeetingRecordingDto } from '../../types';
import { BookingStatus } from '../../constants/bookingStatus';
import { Calendar, Link as LinkIcon, Loader2, Video, FileText } from 'lucide-react';

type MeetingBundle = {
  meeting?: MeetingDetailDto;
  recordings: MeetingRecordingDto[];
};

type BookingTranscriptDetail = {
  loading: boolean;
  loaded: boolean;
  error?: string;
  data?: {
    id?: string;
    title?: string;
    status?: number;
    rawText?: string;
    cleanText?: string;
    segments?: Array<{ startSeconds?: number; endSeconds?: number; text?: string }>;
    createdAt?: string;
    processedAtUtc?: string;
    errorMessage?: string | null;
    summary?: {
      summary?: string;
      keyPoints?: string[];
      topics?: string[];
      sentimentJson?: string;
      model?: string;
      generatedAtUtc?: string;
      reportJson?: string;
      mindmapJson?: string;
    };
  };
};

type MindmapNode = {
  centralTopic?: string;
  branches?: Array<{ topic?: string; subtopics?: string[] }>;
};

type SentimentNode = {
  notes?: string;
  overall?: string;
};

type ReportNode = {
  title?: string;
  agenda?: string[];
  highlights?: string[];
  actionItems?: string[];
  decisions?: string[];
  followUps?: string[];
};

type SegmentNode = { startSeconds?: number; endSeconds?: number; text?: string };

function shortText(s?: string, max = 120): string {
  if (!s) return '';
  const x = s.trim();
  return x.length > max ? `${x.slice(0, max - 1)}...` : x;
}

function splitSummaryBullets(summary?: string): string[] {
  if (!summary) return [];
  return summary
    .split(/[.!?]\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((x) => shortText(x, 90));
}

function buildSummaryMindmap(
  summary?: {
    summary?: string;
    keyPoints?: string[];
    topics?: string[];
    model?: string;
    generatedAtUtc?: string;
  },
  sentiment?: SentimentNode | null,
  report?: ReportNode | null
): MindmapNode | null {
  if (!summary && !sentiment && !report) return null;

  const branches: Array<{ topic?: string; subtopics?: string[] }> = [];
  const summaryNodes = splitSummaryBullets(summary?.summary);
  if (summaryNodes.length) branches.push({ topic: 'Summary', subtopics: summaryNodes });
  if (summary?.keyPoints?.length) branches.push({ topic: 'Key Points', subtopics: summary.keyPoints.slice(0, 8).map((x) => shortText(x, 70)) });
  if (summary?.topics?.length) branches.push({ topic: 'Topics', subtopics: summary.topics.slice(0, 8).map((x) => shortText(x, 40)) });

  const sentimentNodes = [sentiment?.overall ? `Overall: ${sentiment.overall}` : '', sentiment?.notes ? shortText(sentiment.notes, 80) : ''].filter(Boolean);
  if (sentimentNodes.length) branches.push({ topic: 'Sentiment', subtopics: sentimentNodes });

  const reportNodes: string[] = [];
  if (report?.agenda?.length) reportNodes.push(...report.agenda.slice(0, 2).map((x) => `Agenda: ${shortText(x, 60)}`));
  if (report?.highlights?.length) reportNodes.push(...report.highlights.slice(0, 2).map((x) => `Highlight: ${shortText(x, 60)}`));
  if (report?.actionItems?.length) reportNodes.push(...report.actionItems.slice(0, 2).map((x) => `Action: ${shortText(x, 60)}`));
  if (report?.decisions?.length) reportNodes.push(...report.decisions.slice(0, 2).map((x) => `Decision: ${shortText(x, 60)}`));
  if (report?.followUps?.length) reportNodes.push(...report.followUps.slice(0, 2).map((x) => `Follow-up: ${shortText(x, 60)}`));
  if (reportNodes.length) branches.push({ topic: 'Report', subtopics: reportNodes.slice(0, 8) });

  const metaNodes = [summary?.model ? `Model: ${summary.model}` : '', summary?.generatedAtUtc ? `Generated: ${new Date(summary.generatedAtUtc).toLocaleString('vi-VN')}` : ''].filter(Boolean);
  if (metaNodes.length) branches.push({ topic: 'Meta', subtopics: metaNodes });

  if (!branches.length) return null;
  return { centralTopic: report?.title || summary?.topics?.[0] || 'Conversation Summary', branches };
}

function buildInsightMindmapFromJson(sentiment?: SentimentNode | null, report?: ReportNode | null): MindmapNode | null {
  if (!sentiment && !report) return null;
  const branches: Array<{ topic?: string; subtopics?: string[] }> = [];

  const sentimentSubs = [
    sentiment?.overall ? `Overall: ${shortText(sentiment.overall, 55)}` : '',
    sentiment?.notes ? shortText(sentiment.notes, 95) : '',
  ].filter(Boolean);
  if (sentimentSubs.length) {
    branches.push({ topic: 'Sentiment Insight', subtopics: sentimentSubs });
  }

  if (report?.highlights?.length) {
    branches.push({
      topic: 'Highlights',
      subtopics: report.highlights.slice(0, 6).map((x) => shortText(x, 70)),
    });
  }
  if (report?.agenda?.length) {
    branches.push({
      topic: 'Agenda',
      subtopics: report.agenda.slice(0, 5).map((x) => shortText(x, 70)),
    });
  }
  if (report?.actionItems?.length) {
    branches.push({
      topic: 'Action Items',
      subtopics: report.actionItems.slice(0, 6).map((x) => shortText(x, 70)),
    });
  }
  if (report?.decisions?.length) {
    branches.push({
      topic: 'Decisions',
      subtopics: report.decisions.slice(0, 6).map((x) => shortText(x, 70)),
    });
  }
  if (report?.followUps?.length) {
    branches.push({
      topic: 'Follow-ups',
      subtopics: report.followUps.slice(0, 6).map((x) => shortText(x, 70)),
    });
  }

  if (!branches.length) return null;
  return {
    centralTopic: report?.title || 'Conversation Insights',
    branches,
  };
}

function buildKeyPointsMindmap(keyPoints?: string[]): MindmapNode | null {
  if (!keyPoints?.length) return null;
  return {
    centralTopic: 'Key Points',
    branches: keyPoints.slice(0, 12).map((kp, idx) => ({
      topic: `Ý chính ${idx + 1}`,
      subtopics: [shortText(kp, 120)],
    })),
  };
}

const SegmentTimeline: React.FC<{ segments: SegmentNode[] }> = ({ segments }) => {
  const normalized = segments
    .map((s) => ({
      start: Math.max(0, Number(s.startSeconds ?? 0)),
      end: Math.max(0, Number(s.endSeconds ?? s.startSeconds ?? 0)),
      text: s.text ?? '',
    }))
    .sort((a, b) => a.start - b.start);

  const total = normalized.length ? Math.max(...normalized.map((s) => s.end), 1) : 1;

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 14,
        padding: '0.68rem',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>Segments Timeline</div>
      <div style={{ display: 'grid', gap: '0.36rem' }}>
        {normalized.map((s, i) => {
          const left = (s.start / total) * 100;
          const width = Math.max(((s.end - s.start) / total) * 100, 2.5);
          const hue = (i * 37) % 360;
          const words = s.text.split(/\s+/).filter(Boolean);
          const keyWords = words.filter((w) => w.length >= 5).slice(0, 3).map((w) => w.toLowerCase());
          const parts = s.text.split(/(\s+)/);
          return (
            <div key={i}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.18rem', display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>[{s.start.toFixed(1)}s - {s.end.toFixed(1)}s]</span>
                <span
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.18)',
                    padding: '0.08rem 0.45rem',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {Math.max(0, s.end - s.start).toFixed(1)}s
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, hsla(${hue}, 80%, 65%, 0.95), hsla(${(hue + 35) % 360}, 85%, 58%, 0.95))`,
                    boxShadow: '0 0 10px rgba(88,166,255,0.25)',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '0.28rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderLeft: `3px solid hsla(${hue}, 85%, 60%, 0.95)`,
                  borderRadius: 10,
                  padding: '0.36rem 0.52rem',
                }}
              >
                {parts.map((p, idx) => {
                  const plain = p.trim().toLowerCase();
                  const isKeyword = plain && keyWords.includes(plain);
                  return isKeyword ? (
                    <mark
                      key={idx}
                      style={{
                        background: 'rgba(255,224,102,0.18)',
                        color: '#ffe082',
                        padding: '0 0.12rem',
                        borderRadius: 3,
                      }}
                    >
                      {p}
                    </mark>
                  ) : (
                    <React.Fragment key={idx}>{p}</React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Tổng thời lượng: {total.toFixed(1)}s
      </div>
    </div>
  );
};

const MindmapDiagram: React.FC<{ data: MindmapNode }> = ({ data }) => {
  const branches = data.branches ?? [];
  const left = branches.filter((_, i) => i % 2 === 0);
  const right = branches.filter((_, i) => i % 2 === 1);

  const nodeStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
    padding: '0.5rem 0.62rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(2px)',
  };

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid rgba(88,166,255,0.30)',
        borderRadius: 16,
        padding: '0.95rem',
        background:
          'radial-gradient(1000px 320px at 50% -20%, rgba(88,166,255,0.18), rgba(88,166,255,0.03) 55%, transparent 78%), linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 32px rgba(0,0,0,0.22)',
      }}
    >
      <svg
        viewBox="0 0 1000 380"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* trunk */}
        <path d="M500 78 L500 130" stroke="rgba(88,166,255,0.70)" strokeWidth="2.2" />
        {/* left connectors */}
        {left.map((_, i) => {
          const y = 170 + i * 70;
          return (
            <path
              key={`l-${i}`}
              d={`M500 130 C460 130, 430 ${y}, 360 ${y}`}
              fill="none"
              stroke="rgba(88,166,255,0.45)"
              strokeWidth="1.8"
            />
          );
        })}
        {/* right connectors */}
        {right.map((_, i) => {
          const y = 170 + i * 70;
          return (
            <path
              key={`r-${i}`}
              d={`M500 130 C540 130, 570 ${y}, 640 ${y}`}
              fill="none"
              stroke="rgba(88,166,255,0.45)"
              strokeWidth="1.8"
            />
          );
        })}
      </svg>

      <div style={{ display: 'grid', placeItems: 'center', marginBottom: '0.7rem' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '0.55rem 1.05rem',
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(88,166,255,0.30), rgba(141,123,255,0.24))',
            border: '1px solid rgba(88,166,255,0.6)',
            fontWeight: 800,
            boxShadow: '0 12px 28px rgba(88,166,255,0.30)',
            maxWidth: 460,
            letterSpacing: '0.01em',
          }}
        >
          {data.centralTopic || 'Central topic'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'grid', gap: '0.55rem', alignContent: 'start' }}>
          {left.map((br, i) => (
            <div key={`left-node-${i}`} style={nodeStyle}>
              <div style={{ fontWeight: 700, marginBottom: '0.34rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7dd3fc', boxShadow: '0 0 0 4px rgba(125,211,252,0.16)' }} />
                {br.topic || `Nhánh ${i + 1}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {(br.subtopics ?? []).map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.73rem',
                      borderRadius: 999,
                      border: '1px dashed rgba(255,255,255,0.28)',
                      padding: '0.14rem 0.48rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: '0.55rem', alignContent: 'start' }}>
          {right.map((br, i) => (
            <div key={`right-node-${i}`} style={nodeStyle}>
              <div style={{ fontWeight: 700, marginBottom: '0.34rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4b5fd', boxShadow: '0 0 0 4px rgba(196,181,253,0.18)' }} />
                {br.topic || `Nhánh ${i + 1}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {(br.subtopics ?? []).map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.73rem',
                      borderRadius: 999,
                      border: '1px dashed rgba(255,255,255,0.28)',
                      padding: '0.14rem 0.48rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function isVideoMp4(contentType?: string): boolean {
  return normalize(contentType) === 'video/mp4';
}

function normalize(s?: string): string {
  return (s ?? '').trim().toLowerCase();
}

type TranscriptRef = { recordingUrl?: string; transcriptId: string };

function normalizeUrl(u?: string): string {
  if (!u) return '';
  return decodeURIComponent(u).trim().toLowerCase();
}

function parseTranscriptRefsFromNotes(notes?: string): TranscriptRef[] {
  if (!notes) return [];
  const lines = notes.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const refs: TranscriptRef[] = [];
  let pendingRecording: string | undefined;

  for (const line of lines) {
    if (line.startsWith('[Meeting Recording]:')) {
      pendingRecording = line.replace('[Meeting Recording]:', '').trim();
      continue;
    }
    if (line.startsWith('[AI Audio Transcript Id]:')) {
      const transcriptId = line.replace('[AI Audio Transcript Id]:', '').trim();
      if (transcriptId) {
        refs.push({ recordingUrl: pendingRecording, transcriptId });
      }
      pendingRecording = undefined;
    }
  }
  return refs;
}

function safeParseJson<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const MenteeMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, MeetingBundle>>({});
  const [bookingTranscriptById, setBookingTranscriptById] = useState<Record<string, BookingTranscriptDetail>>({});
  /** Per recording/transcript panel: which detail sub-tab is active */
  const [transcriptDetailTabByKey, setTranscriptDetailTabByKey] = useState<Record<string, 'segments' | 'summary'>>({});


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const bookingRes = await bookingApi.getMenteeBookings(user.id, 1, 80);
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

  const loadTranscriptById = async (stateKey: string, transcriptId: string) => {
    setBookingTranscriptById((prev) => ({
      ...prev,
      [stateKey]: { loading: true, loaded: false },
    }));
    try {
      const response = await transcriptApi.getById(transcriptId);

      if (!response.isSuccess || !response.data) {
        setBookingTranscriptById((prev) => ({
          ...prev,
          [stateKey]: {
            loading: false,
            loaded: true,
            error: response.message || 'Không tìm thấy transcript cho transcriptId này',
          },
        }));
        return;
      }

      const d = response.data as {
        id?: string;
        title?: string;
        status?: number;
        rawText?: string;
        cleanText?: string;
        segments?: Array<{ startSeconds?: number; endSeconds?: number; text?: string }>;
        createdAt?: string;
        processedAtUtc?: string;
        errorMessage?: string | null;
        summary?: {
          summary?: string;
          keyPoints?: string[];
          topics?: string[];
          sentimentJson?: string;
          model?: string;
          generatedAtUtc?: string;
          reportJson?: string;
          mindmapJson?: string;
        };
      };
      setBookingTranscriptById((prev) => ({
        ...prev,
        [stateKey]: {
          loading: false,
          loaded: true,
          data: {
            id: d.id,
            title: d.title,
            status: d.status,
            rawText: d.rawText,
            cleanText: d.cleanText,
            segments: d.segments ?? [],
            createdAt: d.createdAt,
            processedAtUtc: d.processedAtUtc,
            errorMessage: d.errorMessage,
            summary: d.summary,
          },
        },
      }));
    } catch {
      setBookingTranscriptById((prev) => ({
        ...prev,
        [stateKey]: {
          loading: false,
          loaded: true,
          error: 'Không lấy được transcript (kiểm tra token/quyền hoặc transcriptId)',
        },
      }));
    }
  };

  const parseMindmap = (mindmapJson?: string): MindmapNode | null => {
    if (!mindmapJson) return null;
    try {
      return JSON.parse(mindmapJson) as MindmapNode;
    } catch {
      return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Meetings của tôi</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Xem trực tiếp recording và transcript ngay bên dưới từng buổi.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={36} />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Chưa có booking đã xác nhận/hoàn thành.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((b) => {
            const bundle = meetingByBooking[b.id];
            const meeting = bundle?.meeting;
            const isFinished = meeting?.status === 2;
            const joinUrl = !isFinished ? (meeting?.joinUrl || b.meetingLink) : undefined;
            const recordings = bundle?.recordings ?? [];
            const transcriptRefs = parseTranscriptRefsFromNotes(b.notes);
            return (
              <div key={b.id} className="glass-card" style={{ padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.topic || 'Mentoring session'}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      {new Date(b.scheduleStart).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {joinUrl ? (
                      <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                        <LinkIcon size={14} /> Vào meeting
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {isFinished ? 'Meeting đã kết thúc (ẩn URL Zoom).' : 'Chưa có join URL'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Recording: <strong>{recordings.length}</strong>
                  </div>
                  {recordings.slice(0, 3).map((r) => {
                    const matchedRef =
                      transcriptRefs.find((x) => normalizeUrl(x.recordingUrl) === normalizeUrl(r.storageUrl)) ??
                      transcriptRefs[0];
                    const transcriptStateKey = `${b.id}:${matchedRef?.transcriptId ?? 'none'}:${r.id}`;
                    const transcriptByBooking = bookingTranscriptById[transcriptStateKey];
                    const mindmap = parseMindmap(transcriptByBooking?.data?.summary?.mindmapJson);
                    const sentiment = safeParseJson<SentimentNode>(transcriptByBooking?.data?.summary?.sentimentJson);
                    const report = safeParseJson<ReportNode>(transcriptByBooking?.data?.summary?.reportJson);
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
                        {!isVideoMp4(r.contentType) ? (
                          <div style={{ marginTop: '0.6rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FileText size={14} /> Bản ghi dạng text (không phải video/mp4)
                            </div>
                            <a href={r.storageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.35rem' }}>
                              Mở nội dung text
                            </a>
                          </div>
                        ) : null}
                        <div style={{ marginTop: '0.7rem' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
                            onClick={() =>
                              matchedRef?.transcriptId
                                ? void loadTranscriptById(transcriptStateKey, matchedRef.transcriptId)
                                : undefined
                            }
                            disabled={transcriptByBooking?.loading || !matchedRef?.transcriptId}
                          >
                            {transcriptByBooking?.loading
                              ? 'Đang tải transcript...'
                              : matchedRef?.transcriptId
                                ? 'Xem transcript + summary'
                                : 'Không có transcriptId trong notes'}
                          </button>
                        </div>
                        {transcriptByBooking?.loaded ? (
                          <div
                            style={{
                              marginTop: '0.9rem',
                              padding: '0.85rem',
                              border: '1px solid rgba(88,166,255,0.30)',
                              borderRadius: 14,
                              background:
                                'radial-gradient(900px 260px at 50% -10%, rgba(88,166,255,0.14), rgba(88,166,255,0.03) 56%, transparent 78%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 26px rgba(0,0,0,0.2)',
                            }}
                          >
                            {transcriptByBooking.error ? (
                              <p style={{ margin: 0, color: 'var(--error)' }}>{transcriptByBooking.error}</p>
                            ) : (
                              <>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                                  <strong>{transcriptByBooking.data?.title || 'Transcript'}</strong> (status: {transcriptByBooking.data?.status ?? '-'})
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
                                  {transcriptByBooking.data?.id ? (
                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: 999, padding: '0.18rem 0.55rem' }}>
                                      TranscriptId: {transcriptByBooking.data.id}
                                    </span>
                                  ) : null}
                                  {transcriptByBooking.data?.createdAt ? (
                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: 999, padding: '0.18rem 0.55rem' }}>
                                      Created: {new Date(transcriptByBooking.data.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                  ) : null}
                                  {transcriptByBooking.data?.processedAtUtc ? (
                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', borderRadius: 999, padding: '0.18rem 0.55rem' }}>
                                      Processed: {new Date(transcriptByBooking.data.processedAtUtc).toLocaleString('vi-VN')}
                                    </span>
                                  ) : null}
                                </div>
                                {transcriptByBooking.data?.errorMessage ? (
                                  <p style={{ margin: '0 0 0.5rem', color: 'var(--error)' }}>
                                    <strong>Error:</strong> {transcriptByBooking.data.errorMessage}
                                  </p>
                                ) : null}

                                {(() => {
                                  const detailTab = transcriptDetailTabByKey[transcriptStateKey] ?? 'segments';
                                  const setDetailTab = (t: 'segments' | 'summary') =>
                                    setTranscriptDetailTabByKey((prev) => ({ ...prev, [transcriptStateKey]: t }));
                                  const hasSegments = Boolean(transcriptByBooking.data?.segments?.length);
                                  const generatedMindmap = buildSummaryMindmap(transcriptByBooking.data?.summary, sentiment, report);
                                  const displayMindmap = mindmap ?? generatedMindmap;
                                  const insightMindmap = buildInsightMindmapFromJson(sentiment, report);
                                  const keyPointsMindmap = buildKeyPointsMindmap(transcriptByBooking.data?.summary?.keyPoints);
                                  const hasSummaryText = Boolean(transcriptByBooking.data?.summary?.summary?.trim());
                                  const hasSummaryVisual =
                                    Boolean(displayMindmap) || Boolean(insightMindmap) || Boolean(keyPointsMindmap);
                                  const tabBtn = (id: 'segments' | 'summary', label: string) => {
                                    const active = detailTab === id;
                                    return (
                                      <button
                                        key={id}
                                        type="button"
                                        onClick={() => setDetailTab(id)}
                                        style={{
                                          flex: 1,
                                          minWidth: 120,
                                          padding: '0.5rem 0.75rem',
                                          borderRadius: 10,
                                          border: active
                                            ? '1px solid rgba(88,166,255,0.55)'
                                            : '1px solid rgba(255,255,255,0.12)',
                                          background: active
                                            ? 'linear-gradient(180deg, rgba(88,166,255,0.22), rgba(88,166,255,0.08))'
                                            : 'rgba(255,255,255,0.04)',
                                          color: active ? '#e8f1ff' : 'var(--text-secondary)',
                                          fontWeight: active ? 700 : 600,
                                          fontSize: '0.8125rem',
                                          cursor: 'pointer',
                                          boxShadow: active ? '0 4px 14px rgba(88,166,255,0.2)' : 'none',
                                          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                                        }}
                                      >
                                        {label}
                                      </button>
                                    );
                                  };
                                  return (
                                    <>
                                      <div
                                        style={{
                                          display: 'flex',
                                          gap: '0.5rem',
                                          flexWrap: 'wrap',
                                          marginBottom: '0.65rem',
                                          padding: '0.35rem',
                                          borderRadius: 12,
                                          background: 'rgba(0,0,0,0.18)',
                                          border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                      >
                                        {tabBtn('segments', 'Đoạn thoại (segments)')}
                                        {tabBtn('summary', 'Tóm tắt & mindmap')}
                                      </div>

                                      {detailTab === 'segments' ? (
                                        <div>
                                          {hasSegments ? (
                                            <>
                                              <div
                                                style={{
                                                  fontWeight: 800,
                                                  marginBottom: '0.4rem',
                                                  fontSize: '0.92rem',
                                                  letterSpacing: '0.01em',
                                                  color: '#b9d9ff',
                                                }}
                                              >
                                                Đoạn thoại theo thời gian
                                              </div>
                                              <div style={{ marginBottom: '0.5rem' }}>
                                                <SegmentTimeline segments={transcriptByBooking.data!.segments!} />
                                                <div
                                                  style={{
                                                    maxHeight: 220,
                                                    overflow: 'auto',
                                                    fontSize: '0.78rem',
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: 1.45,
                                                    marginTop: '0.45rem',
                                                  }}
                                                >
                                                  {transcriptByBooking.data!.segments!.map((s, idx) => (
                                                    <div key={idx} style={{ marginBottom: '0.22rem' }}>
                                                      <strong>
                                                        [{s.startSeconds ?? 0}s - {s.endSeconds ?? 0}s]
                                                      </strong>{' '}
                                                      {s.text}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div
                                              style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-muted)',
                                                padding: '1rem 0',
                                                textAlign: 'center',
                                              }}
                                            >
                                              Chưa có segments cho transcript này.
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          <div
                                            style={{
                                              fontWeight: 800,
                                              marginBottom: '0.45rem',
                                              fontSize: '0.92rem',
                                              letterSpacing: '0.01em',
                                              color: '#d7c3ff',
                                            }}
                                          >
                                            Tóm tắt cuộc trò chuyện
                                          </div>
                                          {hasSummaryText ? (
                                            <div
                                              style={{
                                                marginBottom: '0.55rem',
                                                border: '1px solid rgba(215,195,255,0.28)',
                                                borderRadius: 12,
                                                padding: '0.55rem 0.62rem',
                                                background:
                                                  'linear-gradient(180deg, rgba(215,195,255,0.12), rgba(215,195,255,0.03))',
                                                color: 'var(--text-secondary)',
                                              }}
                                            >
                                              <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: '#e5d8ff' }}>
                                                Nội dung tóm tắt
                                              </div>
                                              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                                                {transcriptByBooking.data!.summary!.summary}
                                              </div>
                                            </div>
                                          ) : null}
                                          {displayMindmap ? (
                                            <div style={{ marginBottom: '0.6rem' }}>
                                              <MindmapDiagram data={displayMindmap} />
                                            </div>
                                          ) : null}
                                          {insightMindmap ? (
                                            <div style={{ marginBottom: '0.6rem' }}>
                                              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                                                Insight (sentiment + report)
                                              </div>
                                              <MindmapDiagram data={insightMindmap} />
                                            </div>
                                          ) : null}
                                          {keyPointsMindmap ? (
                                            <div style={{ marginBottom: '0.6rem' }}>
                                              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Ý chính</div>
                                              <MindmapDiagram data={keyPointsMindmap} />
                                            </div>
                                          ) : null}
                                          {!hasSummaryText && !hasSummaryVisual ? (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                              Chưa có dữ liệu tóm tắt hoặc mindmap.
                                            </div>
                                          ) : null}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        ) : null}
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

export default MenteeMeetingsPage;
