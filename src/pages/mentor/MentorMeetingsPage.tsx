import React, { useEffect, useMemo, useState } from "react";
import { bookingApi } from "../../api/booking";
import { meetingApi } from "../../api/meetings";
import { transcriptApi } from "../../api/transcripts";
import { useAuth } from "../../contexts/AuthContext";
import type { BookingResponseDto, MeetingDetailDto, MeetingRecordingDto } from "../../types";
import { BookingStatus } from "../../constants/bookingStatus";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Calendar, Link as LinkIcon, Loader2, Video, Inbox } from "lucide-react";

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
  return normalize(contentType) === "video/mp4";
}

function normalize(s?: string): string {
  return (s ?? "").trim().toLowerCase();
}

function extractTranscriptText(detail: {
  cleanText?: string;
  rawText?: string;
  segments?: Array<{ text?: string }>;
}): string | undefined {
  if (detail.cleanText?.trim()) return detail.cleanText.trim();
  if (detail.rawText?.trim()) return detail.rawText.trim();
  if (detail.segments?.length) {
    const text = detail.segments
      .map((s) => s.text?.trim())
      .filter(Boolean)
      .join(" ");
    return text || undefined;
  }
  return undefined;
}

function extractSummary(summary: unknown): string | undefined {
  if (!summary || typeof summary !== "object") return undefined;
  const value =
    (summary as { summary?: string; Summary?: string }).summary ?? (summary as { Summary?: string }).Summary;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const MentorMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [meetingByBooking, setMeetingByBooking] = useState<Record<string, MeetingBundle>>({});
  const [transcriptByRecording, setTranscriptByRecording] = useState<Record<string, TranscriptViewState>>({});

  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const bookingRes = await bookingApi.getMentorBookings(user.id, pageIndex, PAGE_SIZE);
        const rows = bookingRes.isSuccess ? (bookingRes.data?.items ?? []) : [];
        if (cancelled) return;
        setBookings(rows);
        if (bookingRes.isSuccess && bookingRes.data?.totalPages) {
            setTotalPages(bookingRes.data.totalPages);
        }

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
                  recordings: recordingsRes.isSuccess ? (recordingsRes.data ?? []) : [],
                },
              ] as const;
            } catch {
              return [bookingId, { meeting: undefined, recordings: [] }] as const;
            }
          }),
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
  }, [user, pageIndex]);

  const rows = useMemo(
    () => bookings.filter((b) => b.status === BookingStatus.Confirmed || b.status === BookingStatus.Completed),
    [bookings],
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
        const list = listRes.isSuccess ? (listRes.data ?? []) : [];
        if (cancelled) return;

        for (const recording of unresolved) {
          if (!isVideoMp4(recording.contentType)) {
            try {
              const res = await fetch(recording.storageUrl);
              const text = res.ok ? (await res.text()).trim() : "";
              if (!cancelled) {
                setTranscriptByRecording((prev) => ({
                  ...prev,
                  [recording.id]: { loading: false, found: true, text: text || "Transcript trống." },
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
            const fileName = normalize(decodeURIComponent(recording.storageUrl.split("/").pop() ?? "")).replace(
              /\.[a-z0-9]+$/,
              "",
            );
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
    <div className="admin-page" style={{ paddingBottom: "3rem" }}>
      <AdminPageHeader
        eyebrow="Mentor"
        title="Meetings & Recordings"
        description="Xem trực tiếp bản ghi hình (recording) và nội dung họp (transcript) ngay trên trang, không cần mở link ngoài."
        actions={
          <span
            style={{
              background: "#e0e7ff",
              color: "#4f46e5",
              padding: "0.4rem 0.8rem",
              borderRadius: "99px",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "1px solid #c7d2fe",
            }}
          >
            {loading ? "Đang tải…" : `Tổng cộng ${rows.length} meeting`}
          </span>
        }
      />

      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "5rem 0",
            color: "#64748b",
          }}
        >
          <Loader2 className="animate-spin" size={42} color="#3b82f6" style={{ marginBottom: "1rem" }} />
          <p>Đang đồng bộ dữ liệu meeting...</p>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <Inbox size={50} color="#94a3b8" style={{ margin: "0 auto 1rem", opacity: 0.8 }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
            Chưa có phòng họp nào
          </h3>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto", fontSize: "0.95rem" }}>
            Chưa có lịch hẹn nào được xác nhận hoặc hoàn thành để hiển thị thông tin meeting.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {rows.map((b) => {
            const bundle = meetingByBooking[b.id];
            const meeting = bundle?.meeting;
            const isFinished = meeting?.status === 2;
            const hostUrl = !isFinished ? meeting?.hostUrl : undefined;
            const recordings = bundle?.recordings ?? [];
            const isCompleted = b.status === 4; // BookingStatus.Completed

            return (
              <div
                key={b.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                {/* ---------------- CARD HEADER ---------------- */}
                <div
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    background: isCompleted ? "#f0fdf4" : "#f0f9ff", // Màu nền header tùy trạng thái
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                        {b.topic || "Mentoring session"}
                      </span>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: isCompleted ? "#d1fae5" : "#dbeafe",
                          color: isCompleted ? "#065f46" : "#1e40af",
                          border: `1px solid ${isCompleted ? "#a7f3d0" : "#bfdbfe"}`,
                        }}
                      >
                        {isCompleted ? "Hoàn thành" : "Đã xác nhận"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontWeight: 500,
                      }}
                    >
                      <Calendar size={15} />
                      {new Date(b.scheduleStart).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {hostUrl ? (
                      <a
                        href={hostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "#3b82f6",
                          color: "#ffffff",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 0.2s",
                        }}
                      >
                        <LinkIcon size={16} /> Vào Zoom (Host)
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", padding: "0.5rem 0" }}>
                        {isFinished ? "Meeting đã kết thúc" : "Chưa có URL phòng họp"}
                      </span>
                    )}
                  </div>
                </div>

                {/* ---------------- RECORDINGS SECTION ---------------- */}
                <div style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#64748b",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Video size={16} /> Bản ghi hình & Transcript ({recordings.length})
                  </div>

                  {recordings.length === 0 ? (
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px dashed #cbd5e1",
                        color: "#94a3b8",
                        fontSize: "0.9rem",
                        textAlign: "center",
                      }}
                    >
                      Chưa có bản ghi hình nào được lưu lại.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {recordings.slice(0, 3).map((r) => {
                        return (
                          <div
                            key={r.id}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              overflow: "hidden",
                              background: "#ffffff",
                            }}
                          >
                            {/* Header của từng file record */}
                            <div
                              style={{
                                padding: "0.75rem 1rem",
                                borderBottom: "1px solid #e2e8f0",
                                fontSize: "0.85rem",
                                color: "#475569",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: "#f8fafc",
                                fontWeight: 500,
                              }}
                            >
                              <Video size={15} color="#3b82f6" />
                              Đã lưu lúc: {new Date(r.createdAt).toLocaleString("vi-VN")}
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: "0.75rem",
                                  color: "#94a3b8",
                                  background: "#e2e8f0",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "4px",
                                }}
                              >
                                {r.contentType || "unknown"}
                              </span>
                            </div>

                            {/* Nội dung Record & Transcript */}
                            <div style={{ padding: "1.25rem" }}>
                              {isVideoMp4(r.contentType) ? (
                                <video
                                  controls
                                  preload="metadata"
                                  src={r.storageUrl}
                                  style={{
                                    width: "100%",
                                    maxHeight:600,
                                    borderRadius: "8px",
                                    background: "#0f172a",
                                    marginBottom: "1.25rem",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                  }}
                                />
                              ) : null}

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  color: "#334155",
                                  fontSize: "0.9rem",
                                  marginBottom: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                              </div>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', marginBottom: '2rem', gap: '1.5rem', alignItems: 'center' }}>
           <button
               onClick={() => {
                   setPageIndex((p) => Math.max(1, p - 1));
                   window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               disabled={pageIndex === 1}
               style={{ padding: '0.6rem 1.2rem', background: pageIndex === 1 ? '#cbd5e1' : '#f1f5f9', color: pageIndex === 1 ? '#64748b' : '#334155', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: pageIndex === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
           >
               Trang trước
           </button>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
               Trang
               <input
                   type="number"
                   min={1}
                   max={totalPages}
                   defaultValue={pageIndex}
                   key={pageIndex}
                   title="Nhập số trang và nhấn Enter"
                   onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                           const val = parseInt(e.currentTarget.value, 10);
                           if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                               setPageIndex(val);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                           } else {
                               e.currentTarget.value = pageIndex.toString();
                           }
                       }
                   }}
                   onBlur={(e) => {
                       const val = parseInt(e.currentTarget.value, 10);
                       if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                           setPageIndex(val);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                       } else {
                           e.currentTarget.value = pageIndex.toString();
                       }
                   }}
                   style={{ 
                       width: '50px', 
                       padding: '0.2rem 0', 
                       textAlign: 'center', 
                       borderRadius: '6px', 
                       border: '1px solid #cbd5e1',
                       fontSize: '1rem',
                       fontWeight: 600,
                       color: '#1e293b',
                       outline: 'none',
                       background: '#fff'
                   }}
               />
               / {totalPages}
           </div>
           <button
               onClick={() => {
                   setPageIndex((p) => Math.min(totalPages, p + 1));
                   window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               disabled={pageIndex === totalPages}
               style={{ padding: '0.6rem 1.2rem', background: pageIndex === totalPages ? '#cbd5e1' : '#f1f5f9', color: pageIndex === totalPages ? '#64748b' : '#334155', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: pageIndex === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
           >
               Trang sau
           </button>
        </div>
      )}
    </div>
  );
};

export default MentorMeetingsPage;
