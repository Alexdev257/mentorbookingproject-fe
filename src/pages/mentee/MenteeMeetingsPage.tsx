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

const SEGMENT_COLORS = [
  { bar: 'linear-gradient(90deg, #6366f1, #818cf8)', border: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
  { bar: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', border: '#0ea5e9', bg: 'rgba(14,165,233,0.06)' },
  { bar: 'linear-gradient(90deg, #10b981, #34d399)', border: '#10b981', bg: 'rgba(16,185,129,0.06)' },
  { bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)', border: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  { bar: 'linear-gradient(90deg, #ef4444, #f87171)', border: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
  { bar: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', border: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
  { bar: 'linear-gradient(90deg, #ec4899, #f472b6)', border: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
  { bar: 'linear-gradient(90deg, #14b8a6, #2dd4bf)', border: '#14b8a6', bg: 'rgba(20,184,166,0.06)' },
];

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
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '1rem',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '0.6rem', color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </span>
        Segments Timeline
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {normalized.map((s, i) => {
          const left = (s.start / total) * 100;
          const width = Math.max(((s.end - s.start) / total) * 100, 2.5);
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
          const words = s.text.split(/\s+/).filter(Boolean);
          const keyWords = words.filter((w) => w.length >= 5).slice(0, 3).map((w) => w.toLowerCase());
          const parts = s.text.split(/(\s+)/);
          return (
            <div key={i}>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>[{s.start.toFixed(1)}s - {s.end.toFixed(1)}s]</span>
                <span
                  style={{
                    borderRadius: 999,
                    border: '1px solid #e2e8f0',
                    padding: '0.1rem 0.5rem',
                    fontSize: '0.7rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    fontWeight: 500,
                  }}
                >
                  {Math.max(0, s.end - s.start).toFixed(1)}s
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: 8,
                  borderRadius: 999,
                  background: '#f1f5f9',
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
                    background: color.bar,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  color: '#334155',
                  background: color.bg,
                  border: '1px solid #e2e8f0',
                  borderLeft: `3px solid ${color.border}`,
                  borderRadius: 10,
                  padding: '0.5rem 0.65rem',
                }}
              >
                {parts.map((p, idx) => {
                  const plain = p.trim().toLowerCase();
                  const isKeyword = plain && keyWords.includes(plain);
                  return isKeyword ? (
                    <mark
                      key={idx}
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        color: '#4338ca',
                        padding: '0.05rem 0.18rem',
                        borderRadius: 4,
                        fontWeight: 600,
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
      <div style={{ marginTop: '0.55rem', fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>
        Tổng thời lượng: {total.toFixed(1)}s · {normalized.length} đoạn
      </div>
    </div>
  );
};

const BRANCH_THEMES = [
  { accent: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', text: '#312e81', icon: '✦' },
  { accent: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', text: '#082f49', icon: '●' },
  { accent: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', text: '#064e3b', icon: '■' },
  { accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#78350f', icon: '★' },
  { accent: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', icon: '✦' },
  { accent: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95', icon: '●' },
  { accent: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', text: '#831843', icon: '■' },
  { accent: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4', text: '#134e4a', icon: '★' },
];

const MindmapDiagram: React.FC<{ data: MindmapNode }> = ({ data }) => {
  const branches = data.branches ?? [];
  
  const chunkBranches = (items: { topic?: string; subtopics?: string[] }[]) => {
      const n = items.length;
      if (n === 0) return [];
      if (n === 1) return [items];
      
      let threes = Math.floor(n / 3);
      let remainder = n % 3;
      
      // Avoid a dangling single-item row by converting one generic '3' chunk into two '2' chunks
      if (remainder === 1 && threes > 0) {
          threes -= 1;
          remainder += 3;
      }
      
      const twos = remainder / 2;
      const chunks = [];
      let currentIndex = 0;
      
      // Place chunks of 2 first (e.g. 5 items -> top row 2, bottom row 3)
      for (let i = 0; i < twos; i++) {
          chunks.push(items.slice(currentIndex, currentIndex + 2));
          currentIndex += 2;
      }
      
      for (let i = 0; i < threes; i++) {
          chunks.push(items.slice(currentIndex, currentIndex + 3));
          currentIndex += 3;
      }
      
      return chunks;
  };

  const rows = chunkBranches(branches);
  let globalBranchIndex = 0;

  const ROW_GAP = '1.5rem';
  const BUS_DROP = '2.5rem';

  return (
    <div style={{
      padding: '3rem 1.5rem',
      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 4px 20px rgba(0,0,0,0.03)',
      overflowX: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Central Topic */}
      <div style={{
         background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
         padding: '1.25rem 2.5rem',
         borderRadius: '24px',
         color: '#ffffff',
         fontWeight: 800,
         fontSize: '1.1rem',
         boxShadow: '0 12px 24px -6px rgba(79, 70, 229, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
         maxWidth: '400px',
         textAlign: 'center',
         position: 'relative',
         zIndex: 5,
         lineHeight: 1.4
      }}>
         {data.centralTopic || 'Ghi chép cốt lõi'}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
         
         {rows.map((rowItems, rIndex) => {
             const isFirstRow = rIndex === 0;
             const isLastRow = rIndex === rows.length - 1;

             return (
                 <div key={rIndex} style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      width: '100%',
                      position: 'relative',
                      paddingTop: BUS_DROP,
                      marginTop: isFirstRow ? 0 : ROW_GAP
                 }}>
                     {/* Upper Trunk segment coming from above */}
                     <div style={{
                         position: 'absolute',
                         top: isFirstRow ? 0 : `-${ROW_GAP}`,
                         height: isFirstRow ? BUS_DROP : `calc(${ROW_GAP} + ${BUS_DROP})`,
                         left: '50%',
                         transform: 'translateX(-50%)',
                         width: '3px',
                         background: '#a5b4fc',
                         zIndex: 1
                     }} />

                     {/* Lower Trunk passing through this row to next row */}
                     {!isLastRow && (
                         <div style={{
                             position: 'absolute',
                             top: BUS_DROP,
                             bottom: 0,
                             left: '50%',
                             transform: 'translateX(-50%)',
                             width: '3px',
                             background: '#a5b4fc',
                             zIndex: 1
                         }} />
                     )}

                     {/* The Horizontal Bus for this row */}
                     {rowItems.length > 1 && (
                        <div style={{
                            position: 'absolute',
                            top: BUS_DROP,
                            left: `calc(50% / ${rowItems.length})`,
                            right: `calc(50% / ${rowItems.length})`,
                            height: '3px',
                            background: '#a5b4fc',
                            zIndex: 1
                        }} />
                     )}

                     {/* Render Cards in this row */}
                     {rowItems.map((item, cIndex) => {
                         const themeIndex = globalBranchIndex++;
                         const theme = BRANCH_THEMES[themeIndex % BRANCH_THEMES.length];

                         return (
                             <div key={cIndex} style={{ 
                                  flex: 1, 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  position: 'relative',
                                  padding: '0 0.75rem',
                                  zIndex: 2 // above trunk
                             }}>
                                 {/* Dot at the junction */}
                                 <div style={{
                                     position: 'relative',
                                     width: '14px',
                                     height: '14px',
                                     background: theme.accent,
                                     borderRadius: '50%',
                                     boxShadow: `0 0 0 4px #ffffff, 0 0 12px ${theme.accent}`,
                                     marginTop: '-7px', // center exactly over the 3px bus line
                                     marginBottom: '1.25rem',
                                     zIndex: 3
                                 }} />

                                 {/* Node Card */}
                                 <div style={{
                                    background: '#ffffff',
                                    border: `1px solid ${theme.border}`,
                                    borderTop: `5px solid ${theme.accent}`, // Top accent for top-down layout
                                    borderRadius: '16px',
                                    padding: '1.25rem',
                                    width: '100%',
                                    maxWidth: '400px',
                                    boxShadow: '0 4px 15px -3px rgba(0,0,0,0.04), 0 2px 6px -2px rgba(0,0,0,0.02)',
                                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s'
                                 }}
                                 onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 12px 30px -5px ${theme.accent}30, 0 4px 12px -5px ${theme.accent}20`;
                                 }}
                                 onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0,0,0,0.04), 0 2px 6px -2px rgba(0,0,0,0.02)';
                                 }}
                                 >
                                    <div style={{
                                       fontWeight: 800,
                                       color: theme.text,
                                       fontSize: '0.95rem',
                                       marginBottom: '0.8rem',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       gap: '0.5rem',
                                       textAlign: 'center'
                                    }}>
                                       <span style={{ color: theme.accent, fontSize: '1.1rem', opacity: 0.9 }}>{theme.icon}</span>
                                       {item.topic || `Nhánh ${themeIndex + 1}`}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                       {(item.subtopics ?? []).map((s: string, idx: number) => (
                                          <div key={idx} style={{
                                             display: 'flex',
                                             alignItems: 'flex-start',
                                             gap: '0.6rem',
                                             fontSize: '0.86rem',
                                             color: '#475569',
                                             lineHeight: 1.5,
                                             background: theme.bg,
                                             padding: '0.6rem 0.8rem',
                                             borderRadius: '10px',
                                             border: `1px solid ${theme.bg}`,
                                             transition: 'background 0.2s',
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = theme.bg}
                                          >
                                             <div style={{
                                                marginTop: '0.4rem',
                                                width: '6px',
                                                minWidth: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: theme.accent,
                                                opacity: 0.7
                                             }} />
                                             <span style={{ flex: 1, letterSpacing: '0.01em' }}>{s}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                             </div>
                         )
                     })}
                 </div>
             )
         })}
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

const meetingsWorkspaceCss = `
.meetings-workspace {
  --mtw-bg: #f5f6fb;
  --mtw-surface: #ffffff;
  --mtw-surface-soft: #f8f8fc;
  --mtw-border: #ececf3;
  --mtw-text: #17181c;
  --mtw-muted: #7b7f8f;
  --mtw-purple: #7b61ff;
  --mtw-purple-strong: #6a4df6;
  --mtw-purple-soft: rgba(123, 97, 255, 0.12);
  --mtw-blue-soft: rgba(96, 165, 250, 0.12);
  --mtw-green-soft: rgba(35, 178, 109, 0.12);
  --mtw-shadow: 0 18px 45px rgba(28, 32, 48, 0.06);
  color: var(--mtw-text);
}

.meetings-workspace .mtw-shell {
  background: var(--mtw-bg);
  border: 1px solid var(--mtw-border);
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--mtw-shadow);
}

.meetings-workspace .mtw-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 1rem;
  border-bottom: 1px solid var(--mtw-border);
  margin-bottom: 1rem;
}

.meetings-workspace .mtw-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meetings-workspace .mtw-brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--mtw-purple) 0%, var(--mtw-purple-strong) 100%);
  box-shadow: 0 8px 22px rgba(123, 97, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 1rem;
}

.meetings-workspace .mtw-brand-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #111111;
}

.meetings-workspace .mtw-brand-sub {
  margin: 0.16rem 0 0;
  color: var(--mtw-muted);
  font-size: 0.88rem;
}

.meetings-workspace .mtw-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 16px;
  background: var(--mtw-surface);
  border: 1px solid var(--mtw-border);
  color: var(--mtw-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.meetings-workspace .mtw-hero {
  background: var(--mtw-surface);
  border: 1px solid var(--mtw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.4rem;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
}

.meetings-workspace .mtw-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(123, 97, 255, 0.12), transparent 32%),
    radial-gradient(circle at bottom left, rgba(96, 165, 250, 0.08), transparent 28%);
  pointer-events: none;
}

.meetings-workspace .mtw-hero-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.meetings-workspace .mtw-hero-title {
  margin: 0 0 0.55rem;
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111111;
}

.meetings-workspace .mtw-hero-desc {
  margin: 0;
  color: var(--mtw-muted);
  font-size: 0.98rem;
  max-width: 48rem;
}

.meetings-workspace .mtw-hero-tag {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--mtw-purple-soft);
  color: var(--mtw-purple-strong);
  border: 1px solid rgba(123, 97, 255, 0.18);
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.meetings-workspace .mtw-loading {
  text-align: center;
  padding: 4rem;
}

.meetings-workspace .mtw-empty {
  background: var(--mtw-surface);
  border: 1px solid var(--mtw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 2rem;
  text-align: center;
  color: var(--mtw-muted);
}

.meetings-workspace .mtw-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meetings-workspace .mtw-card {
  background: var(--mtw-surface);
  border: 1px solid var(--mtw-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(21, 26, 38, 0.04);
  padding: 1.1rem 1.15rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.meetings-workspace .mtw-card:hover {
  transform: translateY(-2px);
  border-color: rgba(123, 97, 255, 0.16);
  box-shadow: 0 18px 34px rgba(123, 97, 255, 0.08);
}

.meetings-workspace .mtw-card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

.meetings-workspace .mtw-card-title {
  font-weight: 800;
  color: #111111;
  font-size: 1.05rem;
}

.meetings-workspace .mtw-card-date {
  font-size: 0.82rem;
  color: var(--mtw-muted);
  margin-top: 0.38rem;
  display: flex;
  align-items: center;
  gap: 0.38rem;
}

.meetings-workspace .mtw-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meetings-workspace .mtw-primary-btn {
  min-height: 40px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #7b61ff 0%, #6a4df6 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-weight: 700;
  padding: 0.62rem 0.9rem;
  text-decoration: none;
  box-shadow: 0 10px 20px rgba(123, 97, 255, 0.2);
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.meetings-workspace .mtw-primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(123, 97, 255, 0.26);
}

.meetings-workspace .mtw-primary-btn:disabled {
  opacity: 0.68;
  cursor: not-allowed;
  box-shadow: none;
}

.meetings-workspace .mtw-muted-text {
  font-size: 0.8125rem;
  color: var(--mtw-muted);
}

.meetings-workspace .mtw-recording-wrap {
  margin-top: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.meetings-workspace .mtw-recording-count {
  font-size: 0.82rem;
  color: var(--mtw-muted);
  font-weight: 600;
}

.meetings-workspace .mtw-recording-card {
  border: 1px solid var(--mtw-border);
  border-radius: 20px;
  padding: 0.9rem;
  background:
    linear-gradient(180deg, #ffffff, #fbfbff);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
}

.meetings-workspace .mtw-recording-meta {
  margin-bottom: 0.6rem;
  font-size: 0.8125rem;
  color: var(--mtw-muted);
  display: flex;
  align-items: center;
  gap: 0.38rem;
  font-weight: 600;
}

.meetings-workspace .mtw-recording-card video {
  width: 100%;
  max-height: 520px;
  border-radius: 14px !important;
  background: #000;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: block;
}

.meetings-workspace .mtw-text-recording {
  margin-top: 0.6rem;
  font-size: 0.8125rem;
  color: var(--mtw-muted);
  padding: 0.75rem 0.8rem;
  background: var(--mtw-surface-soft);
  border: 1px solid var(--mtw-border);
  border-radius: 14px;
}

.meetings-workspace .mtw-text-recording-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
}

.meetings-workspace .mtw-link {
  color: var(--mtw-purple-strong);
  text-decoration: none;
  font-weight: 700;
}

.meetings-workspace .mtw-link:hover {
  text-decoration: underline;
}

.meetings-workspace .mtw-transcript-box {
  margin-top: 0.95rem;
  padding: 0.95rem;
  border: 1px solid rgba(123,97,255,0.18);
  border-radius: 20px;
  background:
    radial-gradient(900px 260px at 50% -10%, rgba(123,97,255,0.10), rgba(123,97,255,0.02) 56%, transparent 78%),
    linear-gradient(180deg, #ffffff, #fafafe);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 12px 26px rgba(21,26,38,0.05);
}

.meetings-workspace .mtw-transcript-headline {
  font-size: 0.82rem;
  color: var(--mtw-muted);
  margin-bottom: 0.65rem;
  line-height: 1.5;
}

.meetings-workspace .mtw-chip-row {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.meetings-workspace .mtw-chip-row span {
  font-size: 0.74rem;
  color: #8a8fa3;
  border: 1px solid var(--mtw-border);
  background: #fff;
  border-radius: 999px;
  padding: 0.2rem 0.58rem;
  font-weight: 600;
}

.meetings-workspace .mtw-error {
  margin: 0;
  color: #dc2626;
  font-weight: 600;
}

.meetings-workspace .mtw-section-label {
  font-weight: 800;
  margin-bottom: 0.45rem;
  font-size: 0.92rem;
  letter-spacing: 0.01em;
}

.meetings-workspace .mtw-section-label--segments {
  color: #5a46d8;
}

.meetings-workspace .mtw-section-label--summary {
  color: #7a38c4;
}

.meetings-workspace .mtw-summary-box {
  margin-bottom: 0.6rem;
  border: 1px solid rgba(123,97,255,0.18);
  border-radius: 16px;
  padding: 0.65rem 0.72rem;
  background: linear-gradient(180deg, rgba(123,97,255,0.08), rgba(123,97,255,0.02));
  color: #4b5563;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.62);
}

.meetings-workspace .mtw-summary-box-title {
  font-weight: 800;
  margin-bottom: 0.28rem;
  color: #432fa7;
}

.meetings-workspace .mtw-empty-note {
  font-size: 0.8rem;
  color: var(--mtw-muted);
}

@media (max-width: 760px) {
  .meetings-workspace .mtw-shell {
    border-radius: 20px;
    padding: 0.9rem;
  }

  .meetings-workspace .mtw-topbar,
  .meetings-workspace .mtw-hero-head,
  .meetings-workspace .mtw-card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .meetings-workspace .mtw-hero-title {
    font-size: 1.65rem;
  }

  .meetings-workspace .mtw-card {
    padding: 0.95rem;
  }
}
`;

const MenteeMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, MeetingBundle>>({});
  const [bookingTranscriptById, setBookingTranscriptById] = useState<Record<string, BookingTranscriptDetail>>({});
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
    <>
      <style>{meetingsWorkspaceCss}</style>

      <div className="animate-fade-in meetings-workspace">
        <div>
          <div className="mtw-topbar">
            <div className="mtw-brand">
              <div className="mtw-brand-badge">M</div>
              <div>
                <p className="mtw-brand-title">Meeting Workspace</p>
                <p className="mtw-brand-sub">Recordings and transcript viewer</p>
              </div>
            </div>

            <div className="mtw-chip">
              <Video size={16} strokeWidth={1.9} />
              Meetings archive
            </div>
          </div>

          <div className="mtw-hero">
            <div className="mtw-hero-head">
              <div>
                <h1 className="mtw-hero-title">Meetings của tôi</h1>
                <p className="mtw-hero-desc">Xem trực tiếp recording và transcript ngay bên dưới từng buổi.</p>
              </div>

              <div className="mtw-hero-tag">Meeting overview</div>
            </div>
          </div>

          {loading ? (
            <div className="mtw-loading">
              <Loader2 className="animate-spin" size={36} />
            </div>
          ) : rows.length === 0 ? (
            <div className="mtw-empty">Chưa có booking đã xác nhận/hoàn thành.</div>
          ) : (
            <div className="mtw-list">
              {rows.map((b) => {
                const bundle = meetingByBooking[b.id];
                const meeting = bundle?.meeting;
                const isFinished = meeting?.status === 2;
                const joinUrl = !isFinished ? (meeting?.joinUrl || b.meetingLink) : undefined;
                const recordings = bundle?.recordings ?? [];
                const transcriptRefs = parseTranscriptRefsFromNotes(b.notes);
                return (
                  <div key={b.id} className="mtw-card">
                    <div className="mtw-card-head">
                      <div>
                        <div className="mtw-card-title">{b.topic || 'Mentoring session'}</div>
                        <div className="mtw-card-date">
                          <Calendar size={14} />
                          {new Date(b.scheduleStart).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="mtw-actions">
                        {joinUrl ? (
                          <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="mtw-primary-btn">
                            <LinkIcon size={14} /> Vào meeting
                          </a>
                        ) : (
                          <span className="mtw-muted-text">
                            {isFinished ? 'Meeting đã kết thúc (ẩn URL Zoom).' : 'Chưa có join URL'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mtw-recording-wrap">
                      <div className="mtw-recording-count">
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
                          <div key={r.id} className="mtw-recording-card">
                            <div className="mtw-recording-meta">
                              <Video size={14} /> {new Date(r.createdAt).toLocaleString('vi-VN')} ({r.contentType || 'unknown'})
                            </div>

                            {isVideoMp4(r.contentType) ? (
                              <div style={{ width: '100%', borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                                <video
                                  controls
                                  preload="metadata"
                                  src={r.storageUrl}
                                  style={{ width: '100%', maxHeight: 520, display: 'block', borderRadius: 14, background: '#000' }}
                                />
                              </div>
                            ) : null}

                            {!isVideoMp4(r.contentType) ? (
                              <div className="mtw-text-recording">
                                <div className="mtw-text-recording-row">
                                  <FileText size={14} /> Bản ghi dạng text (không phải video/mp4)
                                </div>
                                <a href={r.storageUrl} target="_blank" rel="noopener noreferrer" className="mtw-link" style={{ display: 'inline-block', marginTop: '0.35rem' }}>
                                  Mở nội dung text
                                </a>
                              </div>
                            ) : null}

                            <div style={{ marginTop: '0.7rem' }}>
                              <button
                                type="button"
                                className="mtw-primary-btn"
                                style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem', minHeight: 'unset' }}
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
                              <div className="mtw-transcript-box">
                                {transcriptByBooking.error ? (
                                  <p className="mtw-error">{transcriptByBooking.error}</p>
                                ) : (
                                  <>
                                    <div className="mtw-transcript-headline">
                                      <strong>{transcriptByBooking.data?.title || 'Transcript'}</strong> (status: {transcriptByBooking.data?.status ?? '-'})
                                    </div>

                                    <div className="mtw-chip-row">
                                      {transcriptByBooking.data?.id ? (
                                        <span>TranscriptId: {transcriptByBooking.data.id}</span>
                                      ) : null}
                                      {transcriptByBooking.data?.createdAt ? (
                                        <span>Created: {new Date(transcriptByBooking.data.createdAt).toLocaleString('vi-VN')}</span>
                                      ) : null}
                                      {transcriptByBooking.data?.processedAtUtc ? (
                                        <span>Processed: {new Date(transcriptByBooking.data.processedAtUtc).toLocaleString('vi-VN')}</span>
                                      ) : null}
                                    </div>

                                    {transcriptByBooking.data?.errorMessage ? (
                                      <p className="mtw-error" style={{ marginBottom: '0.5rem' }}>
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
                                              borderRadius: 12,
                                              border: active
                                                ? '1px solid rgba(123,97,255,0.45)'
                                                : '1px solid #ececf3',
                                              background: active
                                                ? 'linear-gradient(180deg, rgba(123,97,255,0.16), rgba(123,97,255,0.06))'
                                                : '#ffffff',
                                              color: active ? '#4531ad' : '#6b7280',
                                              fontWeight: active ? 700 : 600,
                                              fontSize: '0.8125rem',
                                              cursor: 'pointer',
                                              boxShadow: active ? '0 4px 14px rgba(123,97,255,0.12)' : 'none',
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
                                              borderRadius: 14,
                                              background: '#f7f7fc',
                                              border: '1px solid #ececf3',
                                            }}
                                          >
                                            {tabBtn('segments', 'Đoạn thoại (segments)')}
                                            {tabBtn('summary', 'Tóm tắt & mindmap')}
                                          </div>

                                          {detailTab === 'segments' ? (
                                            <div>
                                              {hasSegments ? (
                                                <>
                                                  <div className="mtw-section-label mtw-section-label--segments">
                                                    Đoạn thoại theo thời gian
                                                  </div>
                                                  <div style={{ marginBottom: '0.5rem' }}>
                                                    <SegmentTimeline segments={transcriptByBooking.data!.segments!} />
                                                    <div
                                                      style={{
                                                        maxHeight: 220,
                                                        overflow: 'auto',
                                                        fontSize: '0.78rem',
                                                        color: '#6b7280',
                                                        lineHeight: 1.5,
                                                        marginTop: '0.45rem',
                                                        background: '#fff',
                                                        border: '1px solid #ececf3',
                                                        borderRadius: 12,
                                                        padding: '0.65rem',
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
                                                <div className="mtw-empty-note" style={{ padding: '1rem 0', textAlign: 'center' }}>
                                                  Chưa có segments cho transcript này.
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="mtw-section-label mtw-section-label--summary">
                                                Tóm tắt cuộc trò chuyện
                                              </div>

                                              {hasSummaryText ? (
                                                <div className="mtw-summary-box">
                                                  <div className="mtw-summary-box-title">Nội dung tóm tắt</div>
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
                                                  <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#111111' }}>
                                                    Insight (sentiment + report)
                                                  </div>
                                                  <MindmapDiagram data={insightMindmap} />
                                                </div>
                                              ) : null}

                                              {keyPointsMindmap ? (
                                                <div style={{ marginBottom: '0.6rem' }}>
                                                  <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#111111' }}>Ý chính</div>
                                                  <MindmapDiagram data={keyPointsMindmap} />
                                                </div>
                                              ) : null}

                                              {!hasSummaryText && !hasSummaryVisual ? (
                                                <div className="mtw-empty-note">
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
      </div>
    </>
  );
};

export default MenteeMeetingsPage;